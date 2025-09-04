import { Router } from 'express';
import { blockchainController } from '@/controllers/blockchain.controller';
import { requireAuth, optionalAuth } from '@/middleware/wallet-auth.middleware';
import { asyncHandler } from '@/middleware/error.middleware';
import rateLimit from 'express-rate-limit';

const router = Router();

// Rate limiting for blockchain endpoints
const blockchainRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: {
    success: false,
    error: 'Too many blockchain requests, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const heavyBlockchainRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute for heavy operations
  message: {
    success: false,
    error: 'Too many heavy blockchain requests, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Public endpoints (no authentication required)
router.get('/health', 
  blockchainRateLimit,
  asyncHandler(blockchainController.getHealth.bind(blockchainController))
);

router.get('/global-state', 
  blockchainRateLimit,
  asyncHandler(blockchainController.getGlobalState.bind(blockchainController))
);

router.get('/time-info', 
  blockchainRateLimit,
  asyncHandler(blockchainController.getTimeInfo.bind(blockchainController))
);

// Timeslot endpoints
router.get('/timeslots/active', 
  blockchainRateLimit,
  asyncHandler(blockchainController.getActiveTimeslots.bind(blockchainController))
);

router.get('/timeslots/:epoch', 
  blockchainRateLimit,
  asyncHandler(blockchainController.getTimeslot.bind(blockchainController))
);

router.get('/timeslots/:epoch/bids', 
  heavyBlockchainRateLimit,
  asyncHandler(blockchainController.getTimeslotBids.bind(blockchainController))
);

router.get('/timeslots/:epoch/supplies', 
  heavyBlockchainRateLimit,
  asyncHandler(blockchainController.getTimeslotSupplies.bind(blockchainController))
);

// Account balance endpoint (public)
router.get('/accounts/:walletAddress/balance', 
  blockchainRateLimit,
  asyncHandler(blockchainController.getAccountBalance.bind(blockchainController))
);

// User-specific endpoints (require authentication)
router.get('/user/bids', 
  requireAuth,
  heavyBlockchainRateLimit,
  asyncHandler(blockchainController.getUserBids.bind(blockchainController))
);

router.get('/user/supplies', 
  requireAuth,
  heavyBlockchainRateLimit,
  asyncHandler(blockchainController.getUserSupplies.bind(blockchainController))
);

// Validation endpoints
router.post('/validate/bid', 
  blockchainRateLimit,
  asyncHandler(blockchainController.validateBidParams.bind(blockchainController))
);

router.post('/validate/supply', 
  blockchainRateLimit,
  asyncHandler(blockchainController.validateSupplyParams.bind(blockchainController))
);

// Development/debugging endpoints
router.get('/pda-addresses', 
  blockchainRateLimit,
  asyncHandler(blockchainController.getPDAAddresses.bind(blockchainController))
);

export default router;
