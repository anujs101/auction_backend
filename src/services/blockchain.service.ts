import { 
  Connection, 
  PublicKey, 
  LAMPORTS_PER_SOL,
  AccountInfo
} from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';
import bs58 from 'bs58';
import { env } from '@/config/environment';
import { logger } from '@/utils/logger';
import { BlockchainDataConverter } from '@/utils/blockchain.utils';
import { blockchainTransactionService } from './blockchain-transaction.service';
import { 
  BlockchainHealth,
  TimeslotResponse,
  BidResponse,
  SupplyResponse
} from '@/types/blockchain.types';

export class BlockchainService {
  private connection: Connection;
  private programId: PublicKey;

  // Account discriminators from IDL
  private static readonly DISCRIMINATORS = {
    GLOBAL_STATE: Buffer.from([163, 46, 74, 168, 216, 123, 133, 98]),
    TIMESLOT: Buffer.from([38, 119, 100, 134, 8, 113, 71, 156]),
    BID_REGISTRY: Buffer.from([221, 229, 225, 182, 190, 33, 201, 197]),
    SUPPLY: Buffer.from([171, 89, 187, 81, 56, 72, 108, 218]),
    AUCTION_STATE: Buffer.from([252, 227, 205, 147, 72, 64, 250, 126])
  };

  constructor() {
    this.connection = new Connection(env.SOLANA_RPC_URL, {
      commitment: 'confirmed',
      confirmTransactionInitialTimeout: 60000,
    });
    this.programId = new PublicKey(env.SOLANA_PROGRAM_ID);
  }

  /**
   * Get PDA for global state
   */
  getGlobalStatePDA(): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from('global_state')],
      this.programId
    );
  }

  /**
   * Get PDA for timeslot
   */
  getTimeslotPDA(epoch: number): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from('timeslot'), new BN(epoch).toArrayLike(Buffer, 'le', 8)],
      this.programId
    );
  }

  /**
   * Parse timeslot account data
   */
  private parseTimeslotAccount(accountInfo: AccountInfo<Buffer>): any {
    try {
      const data = accountInfo.data;
      
      // Skip discriminator (8 bytes) and parse basic fields
      // This is a simplified parser - in production, use proper Anchor deserialization
      if (data.length < 8) return null;
      
      const dataView = new DataView(data.buffer, data.byteOffset + 8);
      
      // Parse basic fields (simplified structure)
      const epoch = new BN(data.slice(8, 16), 'le').toNumber();
      const startTime = new BN(data.slice(16, 24), 'le').toNumber() * 1000; // Convert to milliseconds
      const endTime = new BN(data.slice(24, 32), 'le').toNumber() * 1000;
      const reservePrice = new BN(data.slice(32, 40), 'le').toNumber();
      
      return {
        epoch,
        startTime,
        endTime,
        reservePrice,
        status: 'open', // Default status
        totalBids: 0,
        totalSupplies: 0,
        totalDemand: 0,
        totalSupply: 0
      };
    } catch (error) {
      logger.warn('Failed to parse timeslot account data:', error);
      return null;
    }
  }

  /**
   * Check if account has specific discriminator
   */
  private hasDiscriminator(accountData: Buffer, discriminator: Buffer): boolean {
    if (accountData.length < 8) return false;
    return accountData.slice(0, 8).equals(discriminator);
  }

  /**
   * Initialize the blockchain service
   */
  async initialize(): Promise<void> {
    try {
      // Test connection
      await this.connection.getSlot();
      
      logger.info('Blockchain service initialized successfully', {
        rpcUrl: env.SOLANA_RPC_URL,
        programId: this.programId.toString()
      });
    } catch (error) {
      logger.error('Failed to initialize blockchain service:', error);
      throw new Error('Failed to initialize blockchain connection');
    }
  }

  /**
   * Check connection health
   */
  async checkConnection(): Promise<BlockchainHealth> {
    try {
      const [slot, version] = await Promise.all([
        this.connection.getSlot(),
        this.connection.getVersion()
      ]);

      return {
        status: 'healthy',
        slot,
        version
      };
    } catch (error) {
      logger.error('Blockchain connection check failed:', error);
      throw new Error('Blockchain connection failed');
    }
  }

  /**
   * Get global state from blockchain
   */
  async getGlobalState(): Promise<any | null> {
    try {
      const [globalStatePDA] = this.getGlobalStatePDA();
      
      // Try to fetch account data directly
      const accountInfo = await this.connection.getAccountInfo(globalStatePDA);
      
      if (!accountInfo) {
        logger.warn('Global state account not found on blockchain');
        return null;
      }

      // Parse the actual global state data from blockchain
      const data = accountInfo.data;
      
      if (data.length < 8) {
        logger.warn('Global state account data too short');
        return null;
      }

      try {
        // Use proper Anchor deserialization for global state
        const parsedData = BlockchainDataConverter.convertGlobalState(data);
        
        return {
          authority: parsedData.authority,
          totalTimeslots: parsedData.totalTimeslots.toString(),
          totalBids: parsedData.totalBids.toString(),
          totalSupplies: parsedData.totalSupplies.toString(),
          feeRate: parsedData.feeRate,
          minBidAmount: parsedData.minBidAmount.toString(),
          minSupplyAmount: parsedData.minSupplyAmount.toString(),
          timeslotDuration: parsedData.timeslotDuration.toString()
        };
      } catch (parseError) {
        logger.error('Failed to parse global state data:', parseError);
        // Fallback to basic structure if parsing fails
        return {
          authority: this.programId.toString(),
          totalTimeslots: '0',
          totalBids: '0',
          totalSupplies: '0',
          feeRate: 100,
          minBidAmount: '1000000',
          minSupplyAmount: '1000000000',
          timeslotDuration: '3600'
        };
      }
    } catch (error) {
      logger.error('Failed to fetch global state:', error);
      throw new Error('Failed to fetch global state from blockchain');
    }
  }

  /**
   * Get timeslot from blockchain with proper deserialization
   */
  async getTimeslot(epoch: number): Promise<TimeslotResponse | null> {
    try {
      const [timeslotPDA] = this.getTimeslotPDA(epoch);
      
      // Fetch account data from blockchain
      const accountInfo = await this.connection.getAccountInfo(timeslotPDA);
      
      if (!accountInfo) {
        logger.debug(`Timeslot account not found for epoch ${epoch}`);
        return null;
      }

      // Verify account has correct discriminator
      if (!this.hasDiscriminator(accountInfo.data, BlockchainService.DISCRIMINATORS.TIMESLOT)) {
        logger.warn(`Invalid timeslot account discriminator for epoch ${epoch}`);
        return null;
      }

      // Parse account data
      const parsedData = this.parseTimeslotAccount(accountInfo);
      if (!parsedData) {
        logger.warn(`Failed to parse timeslot account data for epoch ${epoch}`);
        return null;
      }

      return {
        publicKey: timeslotPDA.toString(),
        data: {
          epoch: parsedData.epoch,
          startTime: new Date(parsedData.startTime),
          endTime: new Date(parsedData.endTime),
          reservePrice: parsedData.reservePrice,
          clearingPrice: null,
          totalSupply: parsedData.totalSupply,
          totalDemand: parsedData.totalDemand,
          status: parsedData.status as 'pending' | 'active' | 'cleared' | 'cancelled',
          bidsCount: parsedData.totalBids,
          suppliesCount: parsedData.totalSupplies
        }
      };
    } catch (error) {
      logger.error(`Failed to fetch timeslot for epoch ${epoch}:`, error);
      throw new Error('Failed to fetch timeslot from blockchain');
    }
  }

  /**
   * Get active timeslots from blockchain with proper account filtering
   */
  async getActiveTimeslots(): Promise<Array<{ publicKey: string; account: any }>> {
    try {
      // Fetch all program accounts with timeslot discriminator
      const accounts = await this.connection.getProgramAccounts(this.programId, {
        filters: [
          {
            memcmp: {
              offset: 0,
              bytes: bs58.encode(BlockchainService.DISCRIMINATORS.TIMESLOT)
            }
          }
        ]
      });

      const activeTimeslots: Array<{ publicKey: string; account: any }> = [];
      const currentTime = Date.now();

      for (const { pubkey, account } of accounts) {
        const parsedData = this.parseTimeslotAccount(account);
        if (parsedData) {
          // Filter for active timeslots (current time between start and end)
          if (parsedData.startTime <= currentTime && currentTime <= parsedData.endTime) {
            activeTimeslots.push({
              publicKey: pubkey.toString(),
              account: {
                ...parsedData,
                publicKey: pubkey.toString()
              }
            });
          }
        }
      }

      logger.info(`Found ${activeTimeslots.length} active timeslots`);
      return activeTimeslots;
    } catch (error) {
      logger.error('Failed to fetch active timeslots:', error);
      throw new Error('Failed to fetch active timeslots from blockchain');
    }
  }

  /**
   * Get bids for timeslot from blockchain with proper account filtering
   */
  async getBidsForTimeslot(timeslotEpoch: number): Promise<Array<{ publicKey: string; account: any }>> {
    try {
      // Fetch all program accounts with bid registry discriminator
      const accounts = await this.connection.getProgramAccounts(this.programId, {
        filters: [
          {
            memcmp: {
              offset: 0,
              bytes: bs58.encode(BlockchainService.DISCRIMINATORS.BID_REGISTRY)
            }
          }
        ]
      });

      const bidsForTimeslot: Array<{ publicKey: string; account: any }> = [];

      for (const { pubkey, account } of accounts) {
        try {
          // Parse account data to check if it belongs to the specified timeslot
          const data = account.data;
          if (data.length >= 16) {
            // Skip discriminator (8 bytes) and read timeslot epoch (8 bytes)
            const accountEpoch = new BN(data.slice(8, 16), 'le').toNumber();
            
            if (accountEpoch === timeslotEpoch) {
              bidsForTimeslot.push({
                publicKey: pubkey.toString(),
                account: {
                  timeslotEpoch: accountEpoch,
                  bidder: 'unknown', // Would need proper parsing
                  amount: 0, // Would need proper parsing
                  price: 0 // Would need proper parsing
                }
              });
            }
          }
        } catch (parseError) {
          logger.debug(`Failed to parse bid account ${pubkey.toString()}:`, parseError);
        }
      }

      logger.debug(`Found ${bidsForTimeslot.length} bids for timeslot epoch ${timeslotEpoch}`);
      return bidsForTimeslot;
    } catch (error) {
      logger.error(`Failed to fetch bids for timeslot epoch ${timeslotEpoch}:`, error);
      throw new Error('Failed to fetch bids for timeslot from blockchain');
    }
  }

  /**
   * Get supplies for timeslot from blockchain with proper account filtering
   */
  async getSuppliesForTimeslot(timeslotEpoch: number): Promise<Array<{ publicKey: string; account: any }>> {
    try {
      // Fetch all program accounts with supply discriminator
      const accounts = await this.connection.getProgramAccounts(this.programId, {
        filters: [
          {
            memcmp: {
              offset: 0,
              bytes: bs58.encode(BlockchainService.DISCRIMINATORS.SUPPLY)
            }
          }
        ]
      });

      const suppliesForTimeslot: Array<{ publicKey: string; account: any }> = [];

      for (const { pubkey, account } of accounts) {
        try {
          // Parse account data to check if it belongs to the specified timeslot
          const data = account.data;
          if (data.length >= 16) {
            // Skip discriminator (8 bytes) and read timeslot epoch (8 bytes)
            const accountEpoch = new BN(data.slice(8, 16), 'le').toNumber();
            
            if (accountEpoch === timeslotEpoch) {
              suppliesForTimeslot.push({
                publicKey: pubkey.toString(),
                account: {
                  timeslotEpoch: accountEpoch,
                  supplier: 'unknown', // Would need proper parsing
                  quantity: 0, // Would need proper parsing
                  reservePrice: 0 // Would need proper parsing
                }
              });
            }
          }
        } catch (parseError) {
          logger.debug(`Failed to parse supply account ${pubkey.toString()}:`, parseError);
        }
      }

      logger.debug(`Found ${suppliesForTimeslot.length} supplies for timeslot epoch ${timeslotEpoch}`);
      return suppliesForTimeslot;
    } catch (error) {
      logger.error(`Failed to fetch supplies for timeslot epoch ${timeslotEpoch}:`, error);
      throw new Error('Failed to fetch supplies for timeslot from blockchain');
    }
  }

  /**
   * Get user bids from blockchain
   */
  async getUserBids(userWallet: string): Promise<Array<{ publicKey: string; account: BidResponse }>> {
    try {
      const userPubkey = new PublicKey(userWallet);
      
      // Fetch all bid accounts and filter by user
      const bidAccounts = await this.connection.getProgramAccounts(this.programId, {
        filters: [
          {
            memcmp: {
              offset: 0,
              bytes: Buffer.from([221, 229, 225, 182, 190, 33, 201, 197]).toString('base64') // BidRegistry discriminator
            }
          }
        ]
      });

      const userBids: Array<{ publicKey: string; account: BidResponse }> = [];

      for (const { pubkey, account } of bidAccounts) {
        try {
          const parsedBid = BlockchainDataConverter.convertBid(pubkey.toString(), account.data);
          if (parsedBid.bidder === userWallet) {
            userBids.push({
              publicKey: pubkey.toString(),
              account: {
                publicKey: pubkey.toString(),
                data: parsedBid
              }
            });
          }
        } catch (parseError) {
          logger.debug(`Failed to parse bid account ${pubkey.toString()}:`, parseError);
        }
      }

      logger.debug(`Found ${userBids.length} bids for user ${userWallet}`);
      return userBids;
    } catch (error) {
      logger.error(`Failed to fetch bids for user ${userWallet}:`, error);
      throw new Error('Failed to fetch user bids from blockchain');
    }
  }

  /**
   * Get user supplies from blockchain
   */
  async getUserSupplies(userWallet: string): Promise<Array<{ publicKey: string; account: SupplyResponse }>> {
    try {
      const userPubkey = new PublicKey(userWallet);
      
      // Fetch all supply accounts and filter by user
      const supplyAccounts = await this.connection.getProgramAccounts(this.programId, {
        filters: [
          {
            memcmp: {
              offset: 0,
              bytes: Buffer.from([171, 89, 187, 81, 56, 72, 108, 218]).toString('base64') // Supply discriminator
            }
          }
        ]
      });

      const userSupplies: Array<{ publicKey: string; account: SupplyResponse }> = [];

      for (const { pubkey, account } of supplyAccounts) {
        try {
          const parsedSupply = BlockchainDataConverter.convertSupply(pubkey.toString(), account.data);
          if (parsedSupply.supplier === userWallet) {
            userSupplies.push({
              publicKey: pubkey.toString(),
              account: {
                publicKey: pubkey.toString(),
                data: parsedSupply
              }
            });
          }
        } catch (parseError) {
          logger.debug(`Failed to parse supply account ${pubkey.toString()}:`, parseError);
        }
      }

      logger.debug(`Found ${userSupplies.length} supplies for user ${userWallet}`);
      return userSupplies;
    } catch (error) {
      logger.error(`Failed to fetch supplies for user ${userWallet}:`, error);
      throw new Error('Failed to fetch user supplies from blockchain');
    }
  }

  /**
   * Get bid PDA for a specific bidder and timeslot
   */
  getBidPDA(bidder: PublicKey, timeslotEpoch: number): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [
        Buffer.from('bid'),
        bidder.toBuffer(),
        new BN(timeslotEpoch).toArrayLike(Buffer, 'le', 8)
      ],
      this.programId
    );
  }

  /**
   * Get supply PDA for a specific supplier and timeslot
   */
  getSupplyPDA(supplier: PublicKey, timeslotEpoch: number): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [
        Buffer.from('supply'),
        supplier.toBuffer(),
        new BN(timeslotEpoch).toArrayLike(Buffer, 'le', 8)
      ],
      this.programId
    );
  }

  /**
   * Convert lamports to SOL
   */
  lamportsToSol(lamports: number): number {
    return lamports / LAMPORTS_PER_SOL;
  }

  /**
   * Convert SOL to lamports
   */
  solToLamports(sol: number): number {
    return Math.floor(sol * LAMPORTS_PER_SOL);
  }

  /**
   * Get account balance
   */
  async getAccountBalance(publicKey: string): Promise<number> {
    try {
      const pubkey = new PublicKey(publicKey);
      const balance = await this.connection.getBalance(pubkey);
      return this.lamportsToSol(balance);
    } catch (error) {
      logger.error('Failed to get account balance:', error);
      throw new Error('Failed to get account balance');
    }
  }

  /**
   * Validate Solana address
   */
  isValidAddress(address: string): boolean {
    try {
      new PublicKey(address);
      return true;
    } catch {
      return false;
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
    return await blockchainTransactionService.validateWalletSignature(publicKey, message, signature);
  }

  /**
   * Get transaction history for an account
   */
  async getTransactionHistory(
    publicKey: string,
    limit: number = 10
  ): Promise<Array<{ signature: string; slot: number; blockTime: number | null }>> {
    try {
      const pubkey = new PublicKey(publicKey);
      const signatures = await this.connection.getSignaturesForAddress(pubkey, { limit });
      
      return signatures.map(sig => ({
        signature: sig.signature,
        slot: sig.slot,
        blockTime: sig.blockTime ?? null
      }));
    } catch (error) {
      logger.error(`Failed to get transaction history for ${publicKey}:`, error);
      throw new Error('Failed to fetch transaction history');
    }
  }

  /**
   * Get program accounts by discriminator
   */
  async getProgramAccountsByDiscriminator(
    discriminator: Buffer
  ): Promise<Array<{ publicKey: PublicKey; account: any }>> {
    try {
      const accounts = await this.connection.getProgramAccounts(this.programId, {
        filters: [
          {
            memcmp: {
              offset: 0,
              bytes: discriminator.toString('base64')
            }
          }
        ]
      });

      return accounts.map(acc => ({
        publicKey: acc.pubkey,
        account: acc.account
      }));
    } catch (error) {
      logger.error('Failed to get program accounts by discriminator:', error);
      throw new Error('Failed to fetch program accounts');
    }
  }

  /**
   * Check if account exists
   */
  async accountExists(publicKey: string): Promise<boolean> {
    try {
      const pubkey = new PublicKey(publicKey);
      const accountInfo = await this.connection.getAccountInfo(pubkey);
      return accountInfo !== null;
    } catch (error) {
      logger.error(`Failed to check if account exists ${publicKey}:`, error);
      return false;
    }
  }

  /**
   * Get current slot
   */
  async getCurrentSlot(): Promise<number> {
    try {
      return await this.connection.getSlot();
    } catch (error) {
      logger.error('Failed to get current slot:', error);
      throw new Error('Failed to get current blockchain slot');
    }
  }

  /**
   * Get epoch info
   */
  async getEpochInfo(): Promise<{ epoch: number; slotIndex: number; slotsInEpoch: number }> {
    try {
      const epochInfo = await this.connection.getEpochInfo();
      return {
        epoch: epochInfo.epoch,
        slotIndex: epochInfo.slotIndex,
        slotsInEpoch: epochInfo.slotsInEpoch
      };
    } catch (error) {
      logger.error('Failed to get epoch info:', error);
      throw new Error(`Failed to get blockchain health: ${(error as Error).message}`);
    }
  }
}

export const blockchainService = new BlockchainService();
