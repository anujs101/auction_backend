import { Request, Response, NextFunction } from 'express';
import { logger } from '@/utils/logger';
import { UnauthorizedError } from '@/utils/errors';
import { walletAuthService } from '@/services/wallet-auth.service';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    walletAddress: string;
    isAdmin: boolean;
  };
}

/**
 * Admin authentication middleware
 * Validates JWT token and checks if user is admin
 */
export const adminAuthMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Admin access token required');
    }

    const token = authHeader.substring(7);
    
    // Verify JWT token
    const payload = walletAuthService.verifyToken(token);
    if (!payload) {
      throw new UnauthorizedError('Invalid admin token');
    }

    // Check if wallet is in admin list
    const adminWallets = process.env.ADMIN_WALLETS?.split(',').map(w => w.trim()) || [];
    const isAdmin = adminWallets.includes(payload.walletAddress);
    
    if (!isAdmin) {
      logger.warn('Non-admin attempted admin access', {
        walletAddress: payload.walletAddress.substring(0, 8) + '...',
        endpoint: req.path
      });
      throw new UnauthorizedError('Admin privileges required');
    }

    // Add user info to request
    req.user = {
      id: payload.userId,
      walletAddress: payload.walletAddress,
      isAdmin: true
    };

    logger.info('Admin access granted', {
      walletAddress: payload.walletAddress.substring(0, 8) + '...',
      endpoint: req.path,
      method: req.method
    });

    next();
  } catch (error) {
    logger.error('Admin authentication failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      endpoint: req.path,
      method: req.method
    });
    
    if (error instanceof UnauthorizedError) {
      res.status(401).json({
        success: false,
        error: error.message
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Authentication service error'
      });
    }
  }
};

/**
 * Check if wallet address is admin
 */
export const isAdminWallet = (walletAddress: string): boolean => {
  const adminWallets = process.env.ADMIN_WALLETS?.split(',').map(w => w.trim()) || [];
  return adminWallets.includes(walletAddress);
};

/**
 * Validate admin wallet configuration
 */
export const validateAdminConfig = (): boolean => {
  const adminWallets = process.env.ADMIN_WALLETS;
  
  if (!adminWallets) {
    logger.warn('No admin wallets configured in ADMIN_WALLETS environment variable');
    return false;
  }

  const walletList = adminWallets.split(',').map(w => w.trim()).filter(w => w.length > 0);
  
  if (walletList.length === 0) {
    logger.warn('Empty admin wallets list in ADMIN_WALLETS environment variable');
    return false;
  }

  // Validate wallet address format (basic Solana address validation)
  const invalidWallets = walletList.filter(wallet => {
    return !/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(wallet);
  });

  if (invalidWallets.length > 0) {
    logger.error('Invalid admin wallet addresses found', { invalidWallets });
    return false;
  }

  logger.info('Admin configuration validated', { 
    adminCount: walletList.length,
    wallets: walletList.map(w => w.substring(0, 8) + '...')
  });

  return true;
};
