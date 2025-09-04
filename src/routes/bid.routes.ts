import { Router } from 'express';
import { bidController } from '@/controllers/bid.controller';
import { authenticateWallet } from '@/middleware/wallet-auth.middleware';
import { adminAuthMiddleware } from '@/middleware/admin-auth.middleware';
import rateLimit from 'express-rate-limit';

const router = Router();

// Rate limiting for bid operations
const bidRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Limit each wallet to 50 bid operations per windowMs
  message: {
    success: false,
    error: 'Too many bid requests, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Rate limit by wallet address if authenticated, otherwise by IP
    const user = (req as any).user;
    return user ? user.walletAddress : req.ip;
  }
});

// Stricter rate limiting for bid placement
const placeBidRateLimit = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10, // Limit each wallet to 10 bid placements per 5 minutes
  message: {
    success: false,
    error: 'Too many bid placement attempts, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const user = (req as any).user;
    return user ? user.walletAddress : req.ip;
  }
});

/**
 * POST /api/bids - Place new bid (authenticated wallet required)
 * Request: {
 *   timeslotId: string,
 *   price: number,
 *   quantity: number
 * }
 */
router.post('/', 
  placeBidRateLimit,
  authenticateWallet, 
  bidController.placeBid
);

/**
 * GET /api/bids/:id - Get bid details (owner or admin only)
 */
router.get('/:id', 
  bidRateLimit,
  authenticateWallet, 
  bidController.getBidById
);

/**
 * DELETE /api/bids/:id - Cancel bid (owner only)
 */
router.delete('/:id', 
  bidRateLimit,
  authenticateWallet, 
  bidController.cancelBid
);

/**
 * PUT /api/bids/:id/status - Update bid status (internal use for blockchain events)
 * This endpoint should be protected by admin authentication in production
 */
router.put('/:id/status', 
  bidRateLimit,
  adminAuthMiddleware,
  bidController.updateBidStatus
);

export default router;
