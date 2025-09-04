import { Router } from 'express';
import { bidController } from '@/controllers/bid.controller';
import { supplyController } from '@/controllers/supply.controller';
import { authenticateWallet } from '@/middleware/wallet-auth.middleware';
import rateLimit from 'express-rate-limit';

const router = Router();

// Rate limiting for user-specific operations
const userRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each wallet to 100 requests per windowMs
  message: {
    success: false,
    error: 'Too many requests, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const user = (req as any).user;
    return user ? user.walletAddress : req.ip;
  }
});

/**
 * GET /api/my/bids - Get current user's bids
 */
router.get('/bids', 
  userRateLimit,
  authenticateWallet, 
  bidController.getMyBids
);

/**
 * GET /api/my/supplies - Get current user's supply offers
 */
router.get('/supplies', 
  userRateLimit,
  authenticateWallet, 
  supplyController.getMySupplies
);

export default router;
