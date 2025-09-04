import { PublicKey } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';
import { 
  TimeslotData, 
  BidData, 
  SupplyData, 
  GlobalStateData,
  ConversionUtils 
} from '@/types/blockchain.types';

/**
 * Conversion utilities for blockchain data
 */
export const conversionUtils: ConversionUtils = {
  lamportsToSol: (lamports: BN | number): number => {
    const lamportsBN = typeof lamports === 'number' ? new BN(lamports) : lamports;
    return lamportsBN.toNumber() / 1_000_000_000; // LAMPORTS_PER_SOL
  },

  solToLamports: (sol: number): BN => {
    return new BN(Math.floor(sol * 1_000_000_000));
  },

  timestampToDate: (timestamp: BN): Date => {
    return new Date(timestamp.toNumber() * 1000);
  },

  dateToTimestamp: (date: Date): BN => {
    return new BN(Math.floor(date.getTime() / 1000));
  }
};

/**
 * Convert blockchain account to API response format
 */
export class BlockchainDataConverter {
  /**
   * Convert TimeslotAccount to TimeslotData (production implementation)
   */
  static convertTimeslot(account: any): TimeslotData {
    return {
      epoch: account.epoch?.toNumber() || 0,
      startTime: account.startTime ? new Date(account.startTime.toNumber() * 1000) : new Date(),
      endTime: account.endTime ? new Date(account.endTime.toNumber() * 1000) : new Date(),
      reservePrice: account.reservePrice?.toNumber() || 0,
      clearingPrice: account.clearingPrice?.toNumber() || null,
      totalSupply: account.totalSupply?.toNumber() || 0,
      totalDemand: account.totalDemand?.toNumber() || 0,
      status: account.status || 'pending',
      bidsCount: account.bidsCount?.toNumber() || 0,
      suppliesCount: account.suppliesCount?.toNumber() || 0
    };
  }

  /**
   * Convert BidAccount to BidData (production implementation)
   */
  static convertBid(publicKey: string, account: any): BidData {
    return {
      id: publicKey,
      bidder: account.bidder?.toString() || '',
      timeslotEpoch: account.timeslotEpoch?.toNumber() || 0,
      price: account.price?.toNumber() || 0,
      quantity: account.quantity?.toNumber() || 0,
      timestamp: account.timestamp ? new Date(account.timestamp.toNumber() * 1000) : new Date(),
      status: account.status || 'active',
      transactionSignature: account.transactionSignature?.toString() || undefined
    };
  }

  /**
   * Convert SupplyAccount to SupplyData (production implementation)
   */
  static convertSupply(publicKey: string, account: any): SupplyData {
    return {
      id: publicKey,
      supplier: account.supplier?.toString() || '',
      timeslotEpoch: account.timeslotEpoch?.toNumber() || 0,
      reservePrice: account.reservePrice?.toNumber() || 0,
      quantity: account.quantity?.toNumber() || 0,
      timestamp: account.timestamp ? new Date(account.timestamp.toNumber() * 1000) : new Date(),
      status: account.status || 'committed',
      transactionSignature: account.transactionSignature?.toString() || undefined
    };
  }

  /**
   * Convert GlobalStateAccount to GlobalStateData (production implementation)
   */
  static convertGlobalState(account: any): GlobalStateData {
    return {
      authority: account.authority?.toString() || '',
      paused: account.paused || false,
      totalTimeslots: account.totalTimeslots?.toNumber() || 0,
      totalBids: account.totalBids?.toNumber() || 0,
      totalSupplies: account.totalSupplies?.toNumber() || 0,
      feeRate: account.feeRate?.toNumber() || 0,
      minBidAmount: account.minBidAmount?.toNumber() || 0,
      minSupplyAmount: account.minSupplyAmount?.toNumber() || 0,
      timeslotDuration: account.timeslotDuration?.toNumber() || 3600
    };
  }
}

/**
 * Validation utilities for blockchain data
 */
export class BlockchainValidator {
  /**
   * Validate Solana public key
   */
  static isValidPublicKey(address: string): boolean {
    try {
      new PublicKey(address);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Validate bid parameters
   */
  static validateBidParams(params: {
    price: number;
    quantity: number;
    timeslotEpoch: number;
  }): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (params.price <= 0) {
      errors.push('Price must be greater than 0');
    }

    if (params.quantity <= 0) {
      errors.push('Quantity must be greater than 0');
    }

    if (params.timeslotEpoch < 0) {
      errors.push('Timeslot epoch must be non-negative');
    }

    if (params.price > 1000) {
      errors.push('Price cannot exceed 1000 SOL per kWh');
    }

    if (params.quantity > 1000000) {
      errors.push('Quantity cannot exceed 1,000,000 kWh');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate supply parameters
   */
  static validateSupplyParams(params: {
    reservePrice: number;
    quantity: number;
    timeslotEpoch: number;
  }): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (params.reservePrice < 0) {
      errors.push('Reserve price must be non-negative');
    }

    if (params.quantity <= 0) {
      errors.push('Quantity must be greater than 0');
    }

    if (params.timeslotEpoch < 0) {
      errors.push('Timeslot epoch must be non-negative');
    }

    if (params.reservePrice > 1000) {
      errors.push('Reserve price cannot exceed 1000 SOL per kWh');
    }

    if (params.quantity > 1000000) {
      errors.push('Quantity cannot exceed 1,000,000 kWh');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate timeslot epoch is in valid range
   */
  static validateTimeslotEpoch(epoch: number): boolean {
    const now = Math.floor(Date.now() / 1000);
    const maxFutureEpoch = now + (365 * 24 * 60 * 60); // 1 year in the future
    
    return epoch >= now && epoch <= maxFutureEpoch;
  }
}

/**
 * PDA calculation utilities
 */
export class PDAUtils {
  /**
   * Calculate timeslot PDA seeds
   */
  static getTimeslotSeeds(epoch: number): Buffer[] {
    return [
      Buffer.from('timeslot'),
      new BN(epoch).toArrayLike(Buffer, 'le', 8)
    ];
  }

  /**
   * Calculate bid PDA seeds
   */
  static getBidSeeds(bidder: PublicKey, timeslotEpoch: number): Buffer[] {
    return [
      Buffer.from('bid'),
      bidder.toBuffer(),
      new BN(timeslotEpoch).toArrayLike(Buffer, 'le', 8)
    ];
  }

  /**
   * Calculate supply PDA seeds
   */
  static getSupplySeeds(supplier: PublicKey, timeslotEpoch: number): Buffer[] {
    return [
      Buffer.from('supply'),
      supplier.toBuffer(),
      new BN(timeslotEpoch).toArrayLike(Buffer, 'le', 8)
    ];
  }

  /**
   * Calculate global state PDA seeds
   */
  static getGlobalStateSeeds(): Buffer[] {
    return [Buffer.from('global_state')];
  }
}

/**
 * Error parsing utilities
 */
export class BlockchainErrorParser {
  /**
   * Parse Solana transaction error
   */
  static parseTransactionError(error: any): {
    code: string;
    message: string;
    logs?: string[];
  } {
    if (error?.logs) {
      // Parse program error from logs
      const errorLog = error.logs.find((log: string) => 
        log.includes('Error:') || log.includes('failed:')
      );
      
      if (errorLog) {
        return {
          code: 'PROGRAM_ERROR',
          message: errorLog,
          logs: error.logs
        };
      }
    }

    if (error?.message) {
      return {
        code: 'TRANSACTION_ERROR',
        message: error.message,
        logs: error.logs
      };
    }

    return {
      code: 'UNKNOWN_ERROR',
      message: 'Unknown blockchain error occurred'
    };
  }

  /**
   * Check if error is due to insufficient funds
   */
  static isInsufficientFundsError(error: any): boolean {
    const message = error?.message?.toLowerCase() || '';
    return message.includes('insufficient') && message.includes('funds');
  }

  /**
   * Check if error is due to account not found
   */
  static isAccountNotFoundError(error: any): boolean {
    const message = error?.message?.toLowerCase() || '';
    return message.includes('account') && message.includes('not found');
  }
}

/**
 * Time utilities for blockchain operations
 */
export class TimeUtils {
  /**
   * Get current Unix timestamp
   */
  static getCurrentTimestamp(): number {
    return Math.floor(Date.now() / 1000);
  }

  /**
   * Calculate timeslot epoch from timestamp
   */
  static calculateTimeslotEpoch(timestamp: number, slotDuration: number = 3600): number {
    return Math.floor(timestamp / slotDuration) * slotDuration;
  }

  /**
   * Get next timeslot epoch
   */
  static getNextTimeslotEpoch(slotDuration: number = 3600): number {
    const now = this.getCurrentTimestamp();
    return this.calculateTimeslotEpoch(now + slotDuration, slotDuration);
  }

  /**
   * Check if timeslot is active
   */
  static isTimeslotActive(startTime: number, endTime: number): boolean {
    const now = this.getCurrentTimestamp();
    return now >= startTime && now <= endTime;
  }

  /**
   * Check if timeslot is upcoming
   */
  static isTimeslotUpcoming(startTime: number): boolean {
    const now = this.getCurrentTimestamp();
    return startTime > now;
  }

  /**
   * Check if timeslot is expired
   */
  static isTimeslotExpired(endTime: number): boolean {
    const now = this.getCurrentTimestamp();
    return endTime < now;
  }
}
