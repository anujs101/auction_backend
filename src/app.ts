import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { createServer } from 'http';
import { env } from '@/config/environment';
import { logger } from '@/utils/logger';
import { errorHandler, notFoundHandler } from '@/middleware/error.middleware';
import { initializeSocketService } from '@/websocket/socket.service';

const app = express();
const httpServer = createServer(app);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: env.HELMET_CSP_ENABLED
}));

// CORS configuration
app.use(cors({
  origin: env.CORS_ORIGIN.split(',').map(origin => origin.trim()),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Auction Backend API is running',
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV
  });
});

// API routes
import apiRoutes from '@/routes/index';
app.use('/api', apiRoutes);

// Error handling middleware (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

const startServer = async (): Promise<void> => {
  try {
    // Create logs directory if it doesn't exist
    const fs = await import('fs');
    const path = await import('path');
    
    const logsDir = path.dirname(env.LOG_FILE);
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }

    // Initialize WebSocket service
    const socketService = initializeSocketService(httpServer);
    logger.info('WebSocket service initialized', {
      environment: env.NODE_ENV,
      cors: env.NODE_ENV === 'production' ? 'restricted' : 'open'
    });

    httpServer.listen(env.PORT, () => {
      logger.info(`🚀 Auction Backend server started on port ${env.PORT}`);
      logger.info(`📊 Environment: ${env.NODE_ENV}`);
      logger.info(`🔗 Health check: http://localhost:${env.PORT}/health`);
      logger.info(`🔌 WebSocket server enabled`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: unknown) => {
  logger.error('Unhandled Rejection:', reason);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Start the server
if (require.main === module) {
  startServer();
}

export default app;
