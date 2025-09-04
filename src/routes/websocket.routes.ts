import { Router, Request, Response } from 'express';
import { socketService } from '@/websocket/socket.service';
import { eventsService } from '@/websocket/events.service';
import { logger } from '@/utils/logger';

const router = Router();

/**
 * GET /api/websocket/stats - Get WebSocket connection statistics
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const stats = socketService.getConnectionStats();
    
    res.json({
      success: true,
      data: {
        connectionStats: stats,
        timestamp: new Date()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to get WebSocket statistics'
      }
    });
  }
});

/**
 * POST /api/websocket/test-broadcast - Send test system announcement
 */
router.post('/test-broadcast', async (req: Request, res: Response) => {
  try {
    const { title, message, level } = req.body;
    
    // Validate input
    if (!title || !message) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Title and message are required'
        }
      });
    }

    const validLevels = ['info', 'warning', 'error', 'success'];
    if (!validLevels.includes(level)) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Invalid level. Must be one of: info, warning, error, success'
        }
      });
    }

    // Send system announcement
    eventsService.emitSystemAnnouncement({
      title,
      message,
      level,
      actionUrl: req.body.actionUrl
    });

    logger.info('Test system announcement sent', {
      title,
      level
    });

    res.json({
      success: true,
      message: 'Test announcement sent successfully',
      data: {
        title,
        message,
        level,
        timestamp: new Date()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to send test announcement'
      }
    });
  }
});

/**
 * GET /api/websocket/health - WebSocket health check
 */
router.get('/health', (req: Request, res: Response) => {
  try {
    const stats = socketService.getConnectionStats();
    
    res.json({
      success: true,
      data: {
        status: 'healthy',
        totalConnections: stats.totalConnections,
        authenticatedConnections: stats.authenticatedConnections,
        timestamp: new Date()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        message: 'WebSocket service unavailable'
      }
    });
  }
});

export default router;
