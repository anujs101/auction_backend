import { Router } from 'express';
import authRoutes from './auth.routes';
import blockchainRoutes from './blockchain.routes';
import timeslotRoutes from './timeslot.routes';
import bidRoutes from './bid.routes';
import supplyRoutes from './supply.routes';
import userRoutes from './user.routes';
import websocketRoutes from './websocket.routes';

const router = Router();

// API info endpoint
router.get('/', (req, res) => {
  res.json({
    name: 'Solana Energy Auction API',
    version: '1.0.0',
    status: 'active',
    timestamp: new Date().toISOString()
  });
});

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Mount routes
router.use('/auth', authRoutes);
router.use('/blockchain', blockchainRoutes);
router.use('/timeslots', timeslotRoutes);
router.use('/bids', bidRoutes);
router.use('/supplies', supplyRoutes);
router.use('/users', userRoutes);
router.use('/my', userRoutes); // Add /my prefix for user-specific endpoints
router.use('/websocket', websocketRoutes);

export default router;
