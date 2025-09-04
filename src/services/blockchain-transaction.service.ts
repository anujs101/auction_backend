import { logger } from '@/utils/logger';
import { blockchainService } from './blockchain.service';
import { PublicKey, Transaction, SystemProgram } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';

export class BlockchainTransactionService {
  
  /**
   * Prepare supply offer transaction for blockchain
   */
  async prepareSupplyTransaction(
    supply: { price: number; quantity: number; timeslotId: string },
    userWallet: string
  ): Promise<string> {
    try {
      // 1. Validate wallet address
      const userPublicKey = new PublicKey(userWallet);
      
      // 2. Get program and PDAs
      const program = blockchainService.program;
      const timeslotPda = blockchainService.getTimeslotPDA(supply.timeslotId);
      const supplyPda = blockchainService.getSupplyPDA(supply.timeslotId, userWallet);
      
      // 3. Create supply offer instruction
      const instruction = await program.methods
        .commitSupply(
          new BN(supply.quantity * 10000), // Convert to lamports
          new BN(supply.price * 10000)     // Convert to lamports
        )
        .accounts({
          supply: supplyPda,
          timeslot: timeslotPda,
          user: userPublicKey,
          systemProgram: SystemProgram.programId,
        })
        .instruction();

      // 4. Create transaction
      const transaction = new Transaction().add(instruction);
      
      // 5. Get recent blockhash
      const connection = blockchainService.getConnection();
      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = userPublicKey;

      // 6. Serialize transaction for client signing
      const serializedTx = transaction.serialize({ requireAllSignatures: false });
      const txSignature = `supply_tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      logger.info('Supply transaction prepared', {
        txSignature,
        userWallet: userWallet.substring(0, 8) + '...',
        price: supply.price,
        quantity: supply.quantity,
        serializedLength: serializedTx.length
      });

      return txSignature;
    } catch (error) {
      logger.error('Failed to prepare supply transaction', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userWallet: userWallet.substring(0, 8) + '...'
      });
      throw error;
    }
  }

  /**
   * Prepare supply cancellation transaction
   */
  async prepareCancelSupplyTransaction(
    supply: { id: string; timeslotId: string },
    userWallet: string
  ): Promise<string> {
    try {
      const userPublicKey = new PublicKey(userWallet);
      const program = blockchainService.program;
      const supplyPda = blockchainService.getSupplyPDA(supply.timeslotId, userWallet);
      
      const instruction = await program.methods
        .cancelSupply()
        .accounts({
          supply: supplyPda,
          user: userPublicKey,
        })
        .instruction();

      const transaction = new Transaction().add(instruction);
      const connection = blockchainService.getConnection();
      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = userPublicKey;

      const txSignature = `cancel_supply_tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      logger.info('Supply cancellation transaction prepared', {
        txSignature,
        userWallet: userWallet.substring(0, 8) + '...',
        supplyId: supply.id
      });

      return txSignature;
    } catch (error) {
      logger.error('Failed to prepare supply cancellation transaction', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userWallet: userWallet.substring(0, 8) + '...'
      });
      throw error;
    }
  }

  /**
   * Prepare bid transaction for blockchain
   */
  async prepareBidTransaction(
    bid: { price: number; quantity: number; timeslotId: string },
    userWallet: string
  ): Promise<string> {
    try {
      const userPublicKey = new PublicKey(userWallet);
      const program = blockchainService.program;
      const timeslotPda = blockchainService.getTimeslotPDA(bid.timeslotId);
      const bidPda = blockchainService.getBidPDA(bid.timeslotId, userWallet);
      
      const instruction = await program.methods
        .placeBid(
          new BN(bid.price * 10000),    // Convert to lamports
          new BN(bid.quantity * 10000)  // Convert to lamports
        )
        .accounts({
          bid: bidPda,
          timeslot: timeslotPda,
          user: userPublicKey,
          systemProgram: SystemProgram.programId,
        })
        .instruction();

      const transaction = new Transaction().add(instruction);
      const connection = blockchainService.getConnection();
      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = userPublicKey;

      const txSignature = `bid_tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      logger.info('Bid transaction prepared', {
        txSignature,
        userWallet: userWallet.substring(0, 8) + '...',
        price: bid.price,
        quantity: bid.quantity
      });

      return txSignature;
    } catch (error) {
      logger.error('Failed to prepare bid transaction', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userWallet: userWallet.substring(0, 8) + '...'
      });
      throw error;
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
}

export const blockchainTransactionService = new BlockchainTransactionService();
