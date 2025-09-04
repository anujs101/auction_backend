import { Router } from 'express';
import { supplyController } from '@/controllers/supply.controller';
import { authenticateWallet } from '@/middleware/wallet-auth.middleware';
import { adminAuthMiddleware } from '@/middleware/admin-auth.middleware';
import rateLimit from 'express-rate-limit';

const router = Router();

// Rate limiting for supply operations
const supplyRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Limit each wallet to 50 supply operations per windowMs
  message: {
    success: false,
    error: 'Too many supply requests, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Rate limit by wallet address if authenticated, otherwise by IP
    const user = (req as any).user;
    return user ? user.walletAddress : req.ip;
  }
});

// Stricter rate limiting for supply placement
const placeSupplyRateLimit = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10, // Limit each wallet to 10 supply placements per 5 minutes
  message: {
    success: false,
    error: 'Too many supply placement attempts, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const user = (req as any).user;
    return user ? user.walletAddress : req.ip;
  }
});

/**
 * POST /api/supplies - Place new supply offer (authenticated wallet required)
 * Request: {
 *   timeslotId: string,
 *   price: number,
 *   quantity: number
 * }
 */
router.post('/', 
  placeSupplyRateLimit,
  authenticateWallet, 
  supplyController.placeSupply
);

/**
 * GET /api/supplies/:id - Get supply details (owner or admin only)
 */
router.get('/:id', 
  supplyRateLimit,
  authenticateWallet, 
  supplyController.getSupplyById
);

/**
 * DELETE /api/supplies/:id - Cancel supply offer (owner only)
 */
router.delete('/:id', 
  supplyRateLimit,
  authenticateWallet, 
  supplyController.cancelSupply
);

/**
 * PUT /api/supplies/:id/status - Update supply status (internal use for blockchain events)
 * This endpoint should be protected by admin authentication in production
 */
router.put('/:id/status', 
  supplyRateLimit,
  adminAuthMiddleware,
  supplyController.updateSupplyStatus
);

export default router;
