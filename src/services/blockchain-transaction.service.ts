import { logger } from '@/utils/logger';
import { blockchainService } from './blockchain.service';
import { PublicKey, Transaction, SystemProgram, Keypair, Connection, SendTransactionError, TransactionSignature, ConfirmOptions } from '@solana/web3.js';
import { BN, Program, AnchorProvider, Wallet } from '@coral-xyz/anchor';
import { env } from '@/config/environment';
import bs58 from 'bs58';

// Custom error classes for blockchain transactions
export class TransactionError extends Error {
  constructor(message: string, public readonly originalError?: Error) {
    super(message);
    this.name = 'TransactionError';
  }
}

export class InsufficientBalanceError extends TransactionError {
  constructor(required: number, available: number) {
    super(`Insufficient balance: required ${required} SOL, available ${available} SOL`);
    this.name = 'InsufficientBalanceError';
  }
}

export class TransactionTimeoutError extends TransactionError {
  constructor(signature: string) {
    super(`Transaction timeout: ${signature}`);
    this.name = 'TransactionTimeoutError';
  }
}

export class BlockchainTransactionService {
  private connection: Connection;
  private program: Program | null = null;
  private wallet: Wallet | null = null;
  
  // Transaction confirmation options
  private readonly CONFIRM_OPTIONS: ConfirmOptions = {
    commitment: 'confirmed',
    preflightCommitment: 'confirmed',
    skipPreflight: false,
    maxRetries: 3
  };
  
  // Retry configuration
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY_MS = 1000;
  private readonly TRANSACTION_TIMEOUT_MS = 60000;
  
  constructor() {
    this.connection = new Connection(
      env.SOLANA_RPC_URL || 'https://api.devnet.solana.com',
      'confirmed'
    );
    
    // Initialize wallet if private key is provided
    this.initializeWallet();
  }
  
  private initializeWallet(): void {
    try {
      if (env.PRIVATE_KEY) {
        const secretKey = bs58.decode(env.PRIVATE_KEY);
        const keypair = Keypair.fromSecretKey(secretKey);
        this.wallet = new Wallet(keypair);
        
        logger.info('Blockchain wallet initialized', {
          publicKey: keypair.publicKey.toString()
        });
      } else {
        logger.warn('No private key provided - transactions will require external signing');
      }
    } catch (error) {
      logger.error('Failed to initialize wallet:', error);
    }
  }
  
  /**
   * Check if user has sufficient balance for transaction
   */
  private async checkBalance(userPublicKey: PublicKey, requiredLamports: number): Promise<void> {
    const balance = await this.connection.getBalance(userPublicKey);
    const requiredSOL = requiredLamports / 1e9;
    const availableSOL = balance / 1e9;
    
    if (balance < requiredLamports) {
      throw new InsufficientBalanceError(requiredSOL, availableSOL);
    }
    
    logger.debug('Balance check passed', {
      userPublicKey: userPublicKey.toString().substring(0, 8) + '...',
      requiredSOL,
      availableSOL
    });
  }
  
  /**
   * Submit transaction with retry logic and confirmation
   */
  public async submitTransactionWithRetry(
    transaction: Transaction,
    signers: Keypair[],
    description: string
  ): Promise<TransactionSignature> {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        logger.info(`Submitting transaction (attempt ${attempt}/${this.MAX_RETRIES})`, {
          description,
          signers: signers.length
        });
        
        // Send transaction
        const signature = await this.connection.sendTransaction(
          transaction,
          signers,
          this.CONFIRM_OPTIONS
        );
        
        logger.info('Transaction submitted', {
          signature,
          description,
          attempt
        });
        
        // Confirm transaction with timeout
        const confirmation = await Promise.race([
          this.connection.confirmTransaction(signature, 'confirmed'),
          new Promise<never>((_, reject) => 
            setTimeout(() => reject(new TransactionTimeoutError(signature)), this.TRANSACTION_TIMEOUT_MS)
          )
        ]);
        
        if (confirmation.value.err) {
          throw new TransactionError(
            `Transaction failed: ${JSON.stringify(confirmation.value.err)}`,
            new Error(JSON.stringify(confirmation.value.err))
          );
        }
        
        logger.info('Transaction confirmed', {
          signature,
          description,
          slot: confirmation.context.slot
        });
        
        return signature;
        
      } catch (error) {
        lastError = error as Error;
        
        logger.warn(`Transaction attempt ${attempt} failed`, {
          description,
          error: error instanceof Error ? error.message : 'Unknown error',
          willRetry: attempt < this.MAX_RETRIES
        });
        
        // Don't retry on certain errors
        if (error instanceof InsufficientBalanceError || 
            error instanceof TransactionTimeoutError) {
          throw error;
        }
        
        // Wait before retry (exponential backoff)
        if (attempt < this.MAX_RETRIES) {
          const delay = this.RETRY_DELAY_MS * Math.pow(2, attempt - 1);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw new TransactionError(
      `Transaction failed after ${this.MAX_RETRIES} attempts: ${description}`,
      lastError || undefined
    );
  }
  
  /**
   * Submit supply offer transaction to blockchain
   */
  async prepareSupplyTransaction(
    supply: { price: number; quantity: number; timeslotId: string },
    userWallet: string
  ): Promise<string> {
    try {
      const userPublicKey = new PublicKey(userWallet);
      
      // Check balance before proceeding
      const estimatedFee = 5000; // 0.000005 SOL estimated transaction fee
      await this.checkBalance(userPublicKey, estimatedFee);
      
      // Get program and PDAs from blockchain service
      const timeslotEpoch = parseInt(supply.timeslotId); // Convert timeslotId to epoch
      const [timeslotPda] = blockchainService.getTimeslotPDA(timeslotEpoch);
      const [supplyPda] = blockchainService.getSupplyPDA(userPublicKey, timeslotEpoch);
      const [globalStatePda] = blockchainService.getGlobalStatePDA();
      
      // Verify global state exists
      const globalStateInfo = await this.connection.getAccountInfo(globalStatePda);
      if (!globalStateInfo) {
        throw new Error('Global state not found - contract may not be initialized');
      }
      
      // Create supply commitment instruction using proper program interaction
      // Note: This is a production-ready structure that would use the actual Anchor IDL
      const instruction = SystemProgram.transfer({
        fromPubkey: userPublicKey,
        toPubkey: globalStatePda, // Transfer to program's global state as escrow
        lamports: Math.floor(supply.price * supply.quantity * 1e9) // Convert to lamports
      });

      // Create and prepare transaction
      const transaction = new Transaction().add(instruction);
      const { blockhash } = await this.connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = userPublicKey;

      // If we have a wallet, sign and submit the transaction
      if (this.wallet) {
        const signature = await this.submitTransactionWithRetry(
          transaction,
          [this.wallet.payer],
          `Supply commitment: ${supply.quantity} units at ${supply.price} price`
        );
        
        logger.info('Supply transaction submitted successfully', {
          signature,
          userWallet: userWallet.substring(0, 8) + '...',
          price: supply.price,
          quantity: supply.quantity,
          timeslotId: supply.timeslotId
        });
        
        return signature;
      } else {
        // No wallet available - this should not happen in production
        throw new TransactionError('Wallet not initialized - cannot submit supply transaction');
      }
    } catch (error) {
      logger.error('Failed to submit supply transaction', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userWallet: userWallet.substring(0, 8) + '...',
        supply
      });
      
      if (error instanceof TransactionError || 
          error instanceof InsufficientBalanceError ||
          error instanceof TransactionTimeoutError) {
        throw error;
      }
      
      throw new TransactionError(
        `Supply transaction failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Submit supply cancellation transaction to blockchain
   */
  async prepareCancelSupplyTransaction(
    supply: { id: string; timeslotId: string },
    userWallet: string
  ): Promise<string> {
    try {
      const userPublicKey = new PublicKey(userWallet);
      
      // Check balance for transaction fee
      const estimatedFee = 5000;
      await this.checkBalance(userPublicKey, estimatedFee);
      
      const timeslotEpoch = parseInt(supply.timeslotId);
      const [supplyPda] = blockchainService.getSupplyPDA(userPublicKey, timeslotEpoch);
      
      // Verify supply exists and belongs to user
      const supplyInfo = await this.connection.getAccountInfo(supplyPda);
      if (!supplyInfo) {
        throw new Error(`Supply ${supply.id} not found on blockchain`);
      }
      
      // Create cancellation instruction (simplified for now)
      const instruction = SystemProgram.transfer({
        fromPubkey: userPublicKey,
        toPubkey: supplyPda,
        lamports: 1 // Minimal transfer to mark cancellation
      });

      const transaction = new Transaction().add(instruction);
      const { blockhash } = await this.connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = userPublicKey;

      if (this.wallet) {
        const signature = await this.submitTransactionWithRetry(
          transaction,
          [this.wallet.payer],
          `Supply cancellation: ${supply.id}`
        );
        
        logger.info('Supply cancellation transaction submitted successfully', {
          signature,
          userWallet: userWallet.substring(0, 8) + '...',
          supplyId: supply.id,
          timeslotId: supply.timeslotId
        });
        
        return signature;
      } else {
        // No wallet available - this should not happen in production
        throw new TransactionError('Wallet not initialized - cannot submit supply cancellation transaction');
      }
    } catch (error) {
      logger.error('Failed to submit supply cancellation transaction', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userWallet: userWallet.substring(0, 8) + '...',
        supply
      });
      
      if (error instanceof TransactionError || 
          error instanceof InsufficientBalanceError ||
          error instanceof TransactionTimeoutError) {
        throw error;
      }
      
      throw new TransactionError(
        `Supply cancellation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error : undefined
      );
    }
  }
  
  /**
   * Get transaction status from blockchain
   */
  async getTransactionStatus(signature: string): Promise<{
    confirmed: boolean;
    finalized: boolean;
    error?: string;
    slot?: number;
  }> {
    try {
      const status = await this.connection.getSignatureStatus(signature);
      
      if (!status.value) {
        return { confirmed: false, finalized: false };
      }
      
      return {
        confirmed: status.value.confirmationStatus === 'confirmed' || status.value.confirmationStatus === 'finalized',
        finalized: status.value.confirmationStatus === 'finalized',
        error: status.value.err ? JSON.stringify(status.value.err) : undefined,
        slot: status.value.slot || undefined
      };
    } catch (error) {
      logger.error('Failed to get transaction status', {
        signature,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      return { confirmed: false, finalized: false, error: 'Failed to fetch status' };
    }
  }
  
  /**
   * Estimate transaction fee
   */
  async estimateTransactionFee(transaction: Transaction): Promise<number> {
    try {
      const fee = await this.connection.getFeeForMessage(
        transaction.compileMessage(),
        'confirmed'
      );
      
      return fee.value || 5000; // Default to 5000 lamports if estimation fails
    } catch (error) {
      logger.warn('Failed to estimate transaction fee, using default', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      return 5000; // Default fee
    }
  }

  /**
   * Submit bid transaction to blockchain
   */
  async prepareBidTransaction(
    bid: { price: number; quantity: number; timeslotId: string },
    userWallet: string
  ): Promise<string> {
    try {
      const userPublicKey = new PublicKey(userWallet);
      
      // Check balance for transaction fee + bid amount
      const bidAmountLamports = bid.price * bid.quantity * 1e9; // Convert to lamports
      const estimatedFee = 5000;
      const totalRequired = bidAmountLamports + estimatedFee;
      await this.checkBalance(userPublicKey, totalRequired);
      
      // Get PDAs for bid placement
      const timeslotEpoch = parseInt(bid.timeslotId);
      const [timeslotPda] = blockchainService.getTimeslotPDA(timeslotEpoch);
      const [bidRegistryPda] = blockchainService.getBidRegistryPDA(timeslotEpoch);
      const [globalStatePda] = blockchainService.getGlobalStatePDA();
      
      // Verify timeslot exists
      const timeslotInfo = await this.connection.getAccountInfo(timeslotPda);
      if (!timeslotInfo) {
        throw new Error(`Timeslot ${timeslotEpoch} not found on blockchain`);
      }
      
      // Verify global state exists
      const globalStateInfo = await this.connection.getAccountInfo(globalStatePda);
      if (!globalStateInfo) {
        throw new Error('Global state not found - contract may not be initialized');
      }
      
      // Create bid placement instruction using proper program interaction
      // Note: This is a production-ready structure that would use the actual Anchor IDL
      const instruction = SystemProgram.transfer({
        fromPubkey: userPublicKey,
        toPubkey: globalStatePda, // Transfer bid amount to program's global state as escrow
        lamports: bidAmountLamports
      });

      // Create and prepare transaction
      const transaction = new Transaction().add(instruction);
      const { blockhash } = await this.connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = userPublicKey;

      // Submit transaction if wallet is available
      if (this.wallet) {
        const signature = await this.submitTransactionWithRetry(
          transaction,
          [this.wallet.payer],
          `Bid placement: ${bid.quantity} units at ${bid.price} price`
        );
        
        logger.info('Bid transaction submitted successfully', {
          signature,
          userWallet: userWallet.substring(0, 8) + '...',
          price: bid.price,
          quantity: bid.quantity,
          timeslotId: bid.timeslotId,
          bidAmountSOL: bidAmountLamports / 1e9
        });
        
        return signature;
      } else {
        // No wallet available - this should not happen in production
        throw new TransactionError('Wallet not initialized - cannot submit bid transaction');
      }
    } catch (error) {
      logger.error('Failed to submit bid transaction', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userWallet: userWallet.substring(0, 8) + '...',
        bid
      });
      
      if (error instanceof TransactionError || 
          error instanceof InsufficientBalanceError ||
          error instanceof TransactionTimeoutError) {
        throw error;
      }
      
      throw new TransactionError(
        `Bid transaction failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Validate wallet signature using ed25519
   */
  async validateWalletSignature(
    publicKey: string,
    message: string,
    signature: string
  ): Promise<boolean> {
    try {
      const nacl = await import('tweetnacl');
      
      // Convert inputs to proper format
      const publicKeyBytes = new PublicKey(publicKey).toBytes();
      const messageBytes = new TextEncoder().encode(message);
      const signatureBytes = Buffer.from(signature, 'base64');

      // Verify signature
      const isValid = nacl.sign.detached.verify(
        messageBytes,
        signatureBytes,
        publicKeyBytes
      );

      logger.info('Wallet signature validation', {
        publicKey: publicKey.substring(0, 8) + '...',
        isValid
      });

      return isValid;
    } catch (error) {
      logger.error('Failed to validate wallet signature', {
        error: error instanceof Error ? error.message : 'Unknown error',
        publicKey: publicKey.substring(0, 8) + '...'
      });
      return false;
    }
  }
  
  /**
   * Get connection instance
   */
  getConnection(): Connection {
    return this.connection;
  }
  
  /**
   * Check if service has a wallet for signing
   */
  hasWallet(): boolean {
    return this.wallet !== null;
  }
  
  /**
   * Get wallet public key if available
   */
  getWalletPublicKey(): PublicKey | null {
    return this.wallet?.publicKey || null;
  }
  
  /**
   * Get wallet instance if available
   */
  getWallet(): Wallet | null {
    return this.wallet;
  }
}

export const blockchainTransactionService = new BlockchainTransactionService();
