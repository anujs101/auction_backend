import { Request, Response } from 'express';
import { walletAuthService } from '@/services/wallet-auth.service';
import { logger } from '@/utils/logger';
import { asyncHandler } from '@/middleware/error.middleware';
import { ValidationError, AuthenticationError } from '@/utils/errors';
import { env } from '@/config/environment';
import { z } from 'zod';

// Environment-aware validation schemas
const walletAddressSchema = env.NODE_ENV === 'production' 
  ? z.string().min(32).max(44)
  : z.string().min(8).max(44);

const initAuthSchema = z.object({
  walletAddress: walletAddressSchema
});

const verifyAuthSchema = z.object({
  walletAddress: walletAddressSchema,
  signature: z.string().min(1),
  message: z.string().min(1)
});

export class AuthController {
  /**
   * POST /api/auth/init
   * Initialize wallet authentication by generating nonce and message
   */
  initializeAuth = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const validatedData = initAuthSchema.parse(req.body);
    
    const result = await walletAuthService.initializeAuth(validatedData);
    
    res.status(200).json({
      success: true,
      data: {
        nonce: result.nonce,
        message: result.message,
        expiresAt: result.expiresAt.toISOString()
      }
    });
  });

  /**
   * POST /api/auth/verify
   * Verify wallet signature and authenticate user
   */
  verifyAuth = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const validatedData = verifyAuthSchema.parse(req.body);
    
    const result = await walletAuthService.verifyAndAuthenticate(validatedData);
    
    res.status(200).json({
      success: true,
      data: {
        accessToken: result.tokens.accessToken,
        expiresIn: result.tokens.expiresIn,
        user: {
          id: result.user.id,
          walletAddress: result.user.walletAddress,
          createdAt: result.user.createdAt.toISOString(),
          lastLoginAt: result.user.lastLoginAt?.toISOString() || null
        }
      }
    });
  });

  /**
   * GET /api/auth/profile
   * Get current authenticated user profile
   */
  getProfile = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      throw new AuthenticationError('User not authenticated');
    }

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: req.user.id,
          walletAddress: req.user.walletAddress,
          createdAt: req.user.createdAt.toISOString(),
          lastLoginAt: req.user.lastLoginAt?.toISOString() || null
        }
      }
    });
  });

  /**
   * POST /api/auth/logout
   * Logout user (client-side token invalidation)
   */
  logout = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      throw new AuthenticationError('User not authenticated');
    }

    await walletAuthService.logout(req.user.id);
    
    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  });

  /**
   * GET /api/auth/validate
   * Validate current JWT token
   */
  validateToken = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      throw new AuthenticationError('Invalid token');
    }

    res.status(200).json({
      success: true,
      data: {
        valid: true,
        user: {
          id: req.user.id,
          walletAddress: req.user.walletAddress
        }
      }
    });
  });
}

export const authController = new AuthController();
