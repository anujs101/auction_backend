import { PublicKey } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';

// Blockchain connection types
export interface BlockchainHealth {
  status: string;
  slot: number;
  version: any;
}

// Auction program account types
export interface TimeslotData {
  epoch: number;
  startTime: Date;
  endTime: Date;
  reservePrice: number; // in SOL
  clearingPrice: number | null; // in SOL
  totalSupply: number; // in kWh
  totalDemand: number; // in kWh
  status: 'pending' | 'active' | 'cleared' | 'cancelled';
  bidsCount: number;
  suppliesCount: number;
}

export interface BidData {
  id: string;
  bidder: string;
  timeslotEpoch: number;
  price: number; // in SOL per kWh
  quantity: number; // in kWh
  timestamp: Date;
  status: 'active' | 'filled' | 'cancelled';
  transactionSignature?: string;
}

export interface SupplyData {
  id: string;
  supplier: string;
  timeslotEpoch: number;
  reservePrice: number; // in SOL per kWh
  quantity: number; // in kWh
  timestamp: Date;
  status: 'committed' | 'selected' | 'cancelled';
  transactionSignature?: string;
}

export interface GlobalStateData {
  authority: string;
  paused: boolean;
  totalTimeslots: number;
  totalBids: number;
  totalSupplies: number;
  feeRate: number; // basis points (e.g., 100 = 1%)
  minBidAmount: number; // in SOL
  minSupplyAmount: number; // in kWh
  timeslotDuration: number; // in seconds
}

// Transaction building types
export interface TransactionParams {
  userWallet: string;
  instructions: any[];
  signers?: any[];
}

export interface BidParams {
  bidder: string;
  timeslotEpoch: number;
  price: number; // in SOL per kWh
  quantity: number; // in kWh
}

export interface SupplyParams {
  supplier: string;
  timeslotEpoch: number;
  reservePrice: number; // in SOL per kWh
  quantity: number; // in kWh
}

export interface CancelBidParams {
  bidder: string;
  timeslotEpoch: number;
}

export interface CancelSupplyParams {
  supplier: string;
  timeslotEpoch: number;
}

// Program account filters
export interface AccountFilter {
  memcmp?: {
    offset: number;
    bytes: string;
  };
  dataSize?: number;
}

// Blockchain service responses
export interface TimeslotResponse {
  publicKey: string;
  data: TimeslotData;
}

export interface BidResponse {
  publicKey: string;
  data: BidData;
}

export interface SupplyResponse {
  publicKey: string;
  data: SupplyData;
}

// Error types
export interface BlockchainErrorDetails {
  code?: string;
  message: string;
  logs?: string[];
  transactionSignature?: string;
}

// Utility types for conversions
export interface ConversionUtils {
  lamportsToSol: (lamports: BN | number) => number;
  solToLamports: (sol: number) => BN;
  timestampToDate: (timestamp: BN) => Date;
  dateToTimestamp: (date: Date) => BN;
}

// PDA calculation types
export interface PDAResult {
  address: PublicKey;
  bump: number;
}

export interface PDASeeds {
  timeslot: (epoch: number) => Buffer[];
  bid: (bidder: PublicKey, timeslotEpoch: number) => Buffer[];
  supply: (supplier: PublicKey, timeslotEpoch: number) => Buffer[];
  globalState: () => Buffer[];
}

// Account subscription types
export interface AccountSubscription {
  id: number;
  publicKey: PublicKey;
  callback: (accountInfo: any) => void;
}

export interface TimeslotSubscription extends AccountSubscription {
  timeslotEpoch: number;
}

export interface UserSubscription extends AccountSubscription {
  userWallet: string;
  accountType: 'bid' | 'supply';
}
