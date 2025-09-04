import { Router } from 'express';
import { authController } from '@/controllers/auth.controller';
import { authenticateWallet } from '@/middleware/wallet-auth.middleware';
import rateLimit from 'express-rate-limit';

const router = Router();

// Rate limiting for authentication endpoints
const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 requests per windowMs
  message: {
    success: false,
    error: {
      message: 'Too many authentication attempts, please try again later'
    }
  },
  standardHeaders: true,
  legacyHeaders: false
});

const verifyRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 verification attempts per windowMs
  message: {
    success: false,
    error: {
      message: 'Too many verification attempts, please try again later'
    }
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Public routes
router.post('/initialize', authRateLimit, authController.initializeAuth);
router.post('/init', authRateLimit, authController.initializeAuth); // Alias for backward compatibility
router.post('/verify', verifyRateLimit, authController.verifyAuth);

// Protected routes (require authentication)
router.get('/profile', authenticateWallet, authController.getProfile);
router.post('/logout', authenticateWallet, authController.logout);
router.get('/validate', authenticateWallet, authController.validateToken);

export default router;
