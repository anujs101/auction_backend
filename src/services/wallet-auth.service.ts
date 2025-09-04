import jwt from 'jsonwebtoken';
import { prismaService } from '@/database/prisma.service';
import { walletCrypto } from '@/utils/wallet-crypto';
import { logger } from '@/utils/logger';
import { env } from '@/config/environment';
import { 
  WalletAuthRequest, 
  WalletSignRequest, 
  AuthTokens, 
  AuthUser, 
  JWTPayload,
  NonceData 
} from '@/types/wallet-auth.types';
import { 
  AuthenticationError, 
  ValidationError, 
  WalletError,
  NotFoundError 
} from '@/utils/errors';

export class WalletAuthService {
  /**
   * Step 1: Initialize wallet authentication by generating nonce and message
   */
  async initializeAuth(request: WalletAuthRequest): Promise<NonceData> {
    try {
      const { walletAddress } = request;

      // Validate wallet address format (relaxed for development)
      if (env.NODE_ENV === 'production' && !walletCrypto.isValidSolanaAddress(walletAddress)) {
        throw new ValidationError('Invalid Solana wallet address format');
      } else if (env.NODE_ENV !== 'production' && walletAddress.length < 8) {
        throw new ValidationError('Wallet address must be at least 8 characters');
      }

      // Generate nonce and expiration
      const nonce = walletCrypto.generateNonce();
      const expiresAt = walletCrypto.generateNonceExpiration();
      const message = walletCrypto.createSignMessage(walletAddress, nonce);

      // Clean up any existing expired nonces for this wallet
      await this.cleanupExpiredNonces(walletAddress);

      // Store nonce in database
      await prismaService.createAuthNonce(walletAddress, nonce, expiresAt);

      logger.info('Authentication initialized for wallet', {
        walletAddress: walletAddress.substring(0, 8) + '...',
        expiresAt
      });

      return {
        nonce,
        message,
        expiresAt
      };

    } catch (error) {
      logger.error('Failed to initialize wallet authentication:', error);
      if (error instanceof ValidationError || error instanceof WalletError) {
        throw error;
      }
      throw new AuthenticationError('Failed to initialize authentication');
    }
  }

  /**
   * Step 2: Verify signature and authenticate user
   */
  async verifyAndAuthenticate(request: WalletSignRequest): Promise<{ tokens: AuthTokens; user: AuthUser }> {
    try {
      const { walletAddress, signature, message } = request;

      // Validate inputs
      if (!walletAddress || !signature || !message) {
        throw new ValidationError('Missing required authentication parameters');
      }

      // Validate wallet address format (relaxed for development)
      if (env.NODE_ENV === 'production' && !walletCrypto.isValidSolanaAddress(walletAddress)) {
        throw new ValidationError('Invalid Solana wallet address format');
      } else if (env.NODE_ENV !== 'production' && walletAddress.length < 8) {
        throw new ValidationError('Wallet address must be at least 8 characters');
      }

      // Parse and validate message structure
      const parsedMessage = walletCrypto.parseSignedMessage(message);

      // Find and validate nonce
      const nonceRecord = await prismaService.findValidNonce(parsedMessage.nonce);
      if (!nonceRecord) {
        throw new AuthenticationError('Invalid or expired nonce');
      }

      // Verify the nonce belongs to the requesting wallet
      if (nonceRecord.walletAddress !== walletAddress) {
        throw new AuthenticationError('Nonce does not match wallet address');
      }

      // Verify signature
      const verificationResult = await walletCrypto.verifySignature(
        message,
        signature,
        walletAddress
      );

      if (!verificationResult.isValid) {
        throw new AuthenticationError(
          verificationResult.error || 'Invalid signature'
        );
      }

      // Mark nonce as used
      await prismaService.markNonceAsUsed(nonceRecord.id);

      // Find or create user
      let user = await prismaService.findUserByWallet(walletAddress);
      if (!user) {
        user = await prismaService.createUser(walletAddress);
        logger.info('New user created for wallet');
      } else {
        // Update last login time
        await prismaService.updateUserLastLogin(user.id);
      }

      // Create AuthUser object
      const authUser: AuthUser = {
        id: user.id,
        walletAddress: user.walletAddress,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt
      };

      // Generate JWT tokens
      const tokens = this.generateTokens(authUser);

      logger.info('User authenticated successfully');

      return {
        tokens,
        user: authUser
      };

    } catch (error) {
      logger.error('Failed to verify and authenticate wallet:', error);
      if (error instanceof ValidationError || 
          error instanceof AuthenticationError || 
          error instanceof WalletError) {
        throw error;
      }
      throw new AuthenticationError('Authentication failed');
    }
  }

  /**
   * Validate JWT token and return user
   */
  async validateToken(token: string): Promise<AuthUser> {
    try {
      if (!token) {
        throw new AuthenticationError('No token provided');
      }

      // Remove 'Bearer ' prefix if present
      const cleanToken = token.replace(/^Bearer\s+/, '');

      // Verify JWT
      const decoded = jwt.verify(cleanToken, env.JWT_SECRET) as JWTPayload;

      // Find user in database
      const user = await prismaService.findUserByWallet(decoded.walletAddress);
      if (!user) {
        throw new AuthenticationError('User not found');
      }

      return {
        id: user.id,
        walletAddress: user.walletAddress,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt
      };

    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new AuthenticationError('Invalid token');
      }
      if (error instanceof jwt.TokenExpiredError) {
        throw new AuthenticationError('Token expired');
      }
      if (error instanceof AuthenticationError) {
        throw error;
      }
      
      logger.error('Token validation failed:', error);
      throw new AuthenticationError('Token validation failed');
    }
  }

  /**
   * Generate JWT access token
   */
  private generateTokens(user: AuthUser): AuthTokens {
    const payload = {
      userId: user.id,
      walletAddress: user.walletAddress
    };

    const accessToken = jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: '24h'
    });

    // Calculate expiration time in seconds (24h = 86400 seconds)
    const expiresIn = 24 * 60 * 60; // 24 hours in seconds

    return {
      accessToken,
      expiresIn
    };
  }

  /**
   * Clean up expired nonces for a wallet
   */
  private async cleanupExpiredNonces(walletAddress?: string): Promise<void> {
    try {
      if (walletAddress) {
        // Clean up expired nonces for specific wallet
        await prismaService.client.authNonce.deleteMany({
          where: {
            walletAddress,
            expiresAt: { lt: new Date() }
          }
        });
      } else {
        // Clean up all expired nonces
        await prismaService.cleanupExpiredNonces();
      }
    } catch (error) {
      logger.warn('Failed to cleanup expired nonces:', error);
    }
  }

  /**
   * Logout user (invalidate token - client-side responsibility)
   */
  async logout(userId: string): Promise<void> {
    try {
      logger.info('User logged out', { userId });
      // Note: JWT tokens are stateless, so actual invalidation happens client-side
    } catch (error) {
      logger.error('Logout failed:', error);
    }
  }
}

export const walletAuthService = new WalletAuthService();
