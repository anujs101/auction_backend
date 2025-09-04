export interface WalletAuthRequest {
  walletAddress: string;
}

export interface WalletSignRequest {
  walletAddress: string;
  signature: string;
  message: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
}

export interface AuthUser {
  id: string;
  walletAddress: string;
  createdAt: Date;
  lastLoginAt: Date | null;
}

export interface JWTPayload {
  userId: string;
  walletAddress: string;
  iat: number;
  exp: number;
}

export interface NonceData {
  nonce: string;
  message: string;
  expiresAt: Date;
}

import { Request } from 'express';

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}
