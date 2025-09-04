import { Request, Response, NextFunction } from 'express';
import { walletAuthService } from '@/services/wallet-auth.service';
import { logger } from '@/utils/logger';
import { AuthenticationError } from '@/utils/errors';
import { AuthUser } from '@/types/wallet-auth.types';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

/**
 * Middleware to authenticate wallet-based JWT tokens
 * Requires valid JWT token in Authorization header
 */
export const authenticateWallet = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      res.status(401).json({
        success: false,
        error: {
          message: 'Authorization header required'
        }
      });
      return;
    }

    const token = authHeader.replace(/^Bearer\s+/, '');
    
    if (!token) {
      res.status(401).json({
        success: false,
        error: {
          message: 'JWT token required'
        }
      });
      return;
    }

    // Validate token and get user
    const user = await walletAuthService.validateToken(token);
    
    // Attach user to request object
    req.user = user;
    
    logger.debug('User authenticated via JWT', {
      userId: user.id,
      walletAddress: user.walletAddress.substring(0, 8) + '...',
      path: req.path
    });

    next();

  } catch (error) {
    logger.warn('Authentication failed:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      path: req.path,
      ip: req.ip
    });

    if (error instanceof AuthenticationError) {
      res.status(401).json({
        success: false,
        error: {
          message: error.message
        }
      });
      return;
    }

    res.status(401).json({
      success: false,
      error: {
        message: 'Authentication failed'
      }
    });
  }
};

/**
 * Optional authentication middleware
 * Attaches user to request if valid token is provided, but doesn't require it
 */
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      next();
      return;
    }

    const token = authHeader.replace(/^Bearer\s+/, '');
    
    if (!token) {
      next();
      return;
    }

    try {
      // Validate token and get user
      const user = await walletAuthService.validateToken(token);
      req.user = user;
      
      logger.debug('Optional auth: User authenticated', {
        userId: user.id,
        walletAddress: user.walletAddress.substring(0, 8) + '...'
      });
    } catch (error) {
      // Log but don't fail the request
      logger.debug('Optional auth: Token validation failed', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    next();

  } catch (error) {
    // Don't fail the request for optional auth
    logger.warn('Optional authentication error:', error);
    next();
  }
};

/**
 * Middleware to check if user is authenticated
 * Use after authenticateWallet middleware
 */
export const requireAuth = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: {
        message: 'Authentication required'
      }
    });
    return;
  }
  
  next();
};

/**
 * Middleware to check if the authenticated user owns the resource
 * Compares req.user.id with req.params.userId or req.body.userId
 */
export const requireOwnership = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: {
        message: 'Authentication required'
      }
    });
    return;
  }

  const resourceUserId = req.params.userId || req.body.userId;
  
  if (!resourceUserId) {
    res.status(400).json({
      success: false,
      error: {
        message: 'Resource user ID not found'
      }
    });
    return;
  }

  if (req.user.id !== resourceUserId) {
    res.status(403).json({
      success: false,
      error: {
        message: 'Access denied: You can only access your own resources'
      }
    });
    return;
  }

  next();
};
