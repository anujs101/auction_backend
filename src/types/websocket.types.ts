import { User } from '@prisma/client';

export interface AuthenticatedSocket {
  id: string;
  user: User;
  walletAddress: string;
  rooms: Set<string>;
  lastActivity: Date;
}

export interface SocketAuthPayload {
  token?: string;
  walletAddress?: string;
}

export interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: Date;
  userId?: string;
  walletAddress?: string;
}

export interface RoomMessage extends WebSocketMessage {
  room: string;
  broadcast: boolean;
}

export interface BidUpdateMessage extends WebSocketMessage {
  type: 'BID_PLACED' | 'BID_CANCELLED' | 'BID_MATCHED';
  data: {
    bidId: string;
    timeslotId: string;
    userId: string;
    price: number;
    quantity: number;
    status: string;
  };
}

export interface SupplyUpdateMessage extends WebSocketMessage {
  type: 'SUPPLY_COMMITTED' | 'SUPPLY_CANCELLED' | 'SUPPLY_ALLOCATED';
  data: {
    supplyId: string;
    timeslotId: string;
    userId: string;
    quantity: number;
    reservePrice: number;
    status: string;
  };
}

export interface TimeslotUpdateMessage extends WebSocketMessage {
  type: 'TIMESLOT_SEALED' | 'TIMESLOT_SETTLED' | 'CLEARING_PRICE_UPDATE';
  data: {
    timeslotId: string;
    status?: string;
    clearingPrice?: number;
    totalEnergy?: number;
  };
}

export interface UserNotificationMessage extends WebSocketMessage {
  type: 'USER_NOTIFICATION';
  data: {
    title: string;
    message: string;
    level: 'info' | 'warning' | 'error' | 'success';
    actionUrl?: string;
  };
}

export interface WalletBalanceUpdateMessage extends WebSocketMessage {
  type: 'WALLET_BALANCE_UPDATE';
  data: {
    walletAddress: string;
    balance: number;
    currency: string;
  };
}

export type SocketEventMessage = 
  | BidUpdateMessage 
  | SupplyUpdateMessage 
  | TimeslotUpdateMessage 
  | UserNotificationMessage 
  | WalletBalanceUpdateMessage;

export interface RoomConfig {
  name: string;
  requiresAuth: boolean;
  walletRestricted: boolean;
  adminOnly: boolean;
  maxConnections?: number;
}

export interface ConnectionStats {
  totalConnections: number;
  authenticatedConnections: number;
  roomConnections: Record<string, number>;
  walletConnections: Record<string, number>;
}

export interface WebSocketConfig {
  cors: {
    origin: string | string[] | boolean;
    credentials: boolean;
  };
  transports: string[];
  pingTimeout: number;
  pingInterval: number;
  maxHttpBufferSize: number;
  allowEIO3: boolean;
}
