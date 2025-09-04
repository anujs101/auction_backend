import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createServer } from 'http';
import { env } from './src/config/environment';
import { securityConfig } from './src/config/security';
import { logger } from './src/utils/logger';
import { errorHandler, notFoundHandler } from './src/middleware/error.middleware';
import { initializeSocketService } from './src/websocket/socket.service';
import routes from './src/routes';

const app = express();
const httpServer = createServer(app);

// Security middleware
app.use(helmet(securityConfig.helmet));
app.use(cors(securityConfig.cors));

// Body parsing middleware with error handling
app.use(express.json({ 
  limit: '10mb',
  strict: true
}));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Custom JSON error handler
app.use((err: any, req: any, res: any, next: any) => {
  if (err instanceof SyntaxError && (err as any).status === 400 && 'body' in err) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Invalid JSON format'
      }
    });
  }
  next(err);
});

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  next();
});

// API routes
app.use('/api', routes);

// Error handling middleware
app.use(notFoundHandler);
app.use(errorHandler);

const PORT = env.PORT || 3000;

// Initialize WebSocket service
let socketService: any;
if (process.env.NODE_ENV !== 'test') {
  socketService = initializeSocketService(httpServer);
}

// Start server only if not in test environment
if (process.env.NODE_ENV !== 'test') {
  httpServer.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`, {
      environment: env.NODE_ENV,
      port: PORT,
      websockets: 'enabled'
    });
  });
}

export { app, httpServer, socketService };