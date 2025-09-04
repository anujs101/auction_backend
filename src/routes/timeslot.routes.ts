import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { timeslotController } from '@/controllers/timeslot.controller';
import { bidController } from '@/controllers/bid.controller';
import { supplyController } from '@/controllers/supply.controller';
import { requireAuth, optionalAuth } from '@/middleware/wallet-auth.middleware';

const router = Router();

// Rate limiting for timeslot operations
const timeslotRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: 'Too many requests, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Rate limiting for creation/modification operations (more restrictive)
const timeslotModifyRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 modification requests per windowMs
  message: {
    success: false,
    error: 'Too many modification requests, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Public routes (no authentication required)
router.get('/active', timeslotRateLimit, timeslotController.getActiveTimeslots.bind(timeslotController));
router.get('/upcoming', timeslotRateLimit, timeslotController.getUpcomingTimeslots.bind(timeslotController));

// Routes that require authentication
router.get('/', timeslotRateLimit, requireAuth, timeslotController.listTimeslots.bind(timeslotController));
router.get('/:id', timeslotRateLimit, optionalAuth, timeslotController.getTimeslotById.bind(timeslotController));
router.get('/:id/stats', timeslotRateLimit, optionalAuth, timeslotController.getTimeslotStats.bind(timeslotController));

// Bid-related routes for timeslots
router.get('/:id/bids', timeslotRateLimit, optionalAuth, bidController.getTimeslotBids);
router.get('/:id/bids/stats', timeslotRateLimit, optionalAuth, bidController.getTimeslotBidStats);

// Supply-related routes for timeslots
router.get('/:id/supplies', timeslotRateLimit, optionalAuth, supplyController.getTimeslotSupplies);
router.get('/:id/supplies/stats', timeslotRateLimit, optionalAuth, supplyController.getTimeslotSupplyStats);

// Admin routes (require authentication and admin privileges)
router.post('/', timeslotModifyRateLimit, requireAuth, timeslotController.createTimeslot.bind(timeslotController));
router.put('/:id', timeslotModifyRateLimit, requireAuth, timeslotController.updateTimeslot.bind(timeslotController));
router.put('/:id/seal', timeslotModifyRateLimit, requireAuth, timeslotController.sealTimeslot.bind(timeslotController));
router.put('/:id/settle', timeslotModifyRateLimit, requireAuth, timeslotController.settleTimeslot.bind(timeslotController));
router.delete('/:id', timeslotModifyRateLimit, requireAuth, timeslotController.cancelTimeslot.bind(timeslotController));

export default router;
