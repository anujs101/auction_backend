import { Request, Response } from 'express';
import { z } from 'zod';
import { timeslotService } from '@/services/timeslot.service';
import { logger } from '@/utils/logger';
import { 
  ValidationError, 
  NotFoundError, 
  AuthorizationError 
} from '@/utils/errors';

// Validation schemas
const createTimeslotSchema = z.object({
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  reservePrice: z.number().min(0),
  description: z.string().optional()
});

const updateTimeslotSchema = z.object({
  reservePrice: z.number().min(0).optional(),
  description: z.string().optional()
});

const listTimeslotsSchema = z.object({
  status: z.enum(['OPEN', 'SEALED', 'SETTLED', 'CANCELLED']).optional(),
  startTimeFrom: z.string().datetime().optional(),
  startTimeTo: z.string().datetime().optional(),
  minReservePrice: z.number().min(0).optional(),
  maxReservePrice: z.number().min(0).optional(),
  page: z.number().int().min(1).optional(),
  limit: z.number().int().min(1).max(100).optional(),
  sortBy: z.enum(['startTime', 'endTime', 'reservePrice', 'createdAt']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional()
});

export class TimeslotController {
  /**
   * Create a new timeslot (admin only)
   * POST /api/timeslots
   */
  async createTimeslot(req: Request, res: Response): Promise<void> {
    try {
      const walletAddress = req.user?.walletAddress;
      if (!walletAddress) {
        res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
        return;
      }

      // Validate request body
      const validatedData = createTimeslotSchema.parse(req.body);

      // Convert string dates to Date objects
      const timeslotData = {
        startTime: new Date(validatedData.startTime),
        endTime: new Date(validatedData.endTime),
        reservePrice: validatedData.reservePrice,
        description: validatedData.description
      };

      const timeslot = await timeslotService.createTimeslot(timeslotData, walletAddress);

      logger.info('Timeslot created successfully', {
        timeslotId: timeslot.id,
        creatorWallet: walletAddress.substring(0, 8) + '...'
      });

      res.status(201).json({
        success: true,
        data: timeslot
      });
    } catch (error) {
      logger.error('Failed to create timeslot:', error);
      
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: 'Invalid request data',
          details: error.errors
        });
        return;
      }

      if (error instanceof ValidationError) {
        res.status(400).json({
          success: false,
          error: error.message
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  /**
   * Get timeslot by ID
   * GET /api/timeslots/:id
   */
  async getTimeslotById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          success: false,
          error: 'Timeslot ID is required'
        });
        return;
      }

      const timeslot = await timeslotService.getTimeslotById(id);

      res.json({
        success: true,
        data: timeslot
      });
    } catch (error) {
      logger.error('Failed to get timeslot:', error);

      if (error instanceof NotFoundError) {
        res.status(404).json({
          success: false,
          error: error.message
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  /**
   * List timeslots with filtering and pagination
   * GET /api/timeslots
   */
  async listTimeslots(req: Request, res: Response): Promise<void> {
    try {
      // Validate query parameters
      const validatedQuery = listTimeslotsSchema.parse(req.query);

      // Convert string dates to Date objects
      const filters = {
        status: validatedQuery.status,
        startTimeFrom: validatedQuery.startTimeFrom ? new Date(validatedQuery.startTimeFrom) : undefined,
        startTimeTo: validatedQuery.startTimeTo ? new Date(validatedQuery.startTimeTo) : undefined,
        minReservePrice: validatedQuery.minReservePrice,
        maxReservePrice: validatedQuery.maxReservePrice
      };

      const pagination = {
        page: validatedQuery.page || 1,
        limit: validatedQuery.limit || 20,
        sortBy: validatedQuery.sortBy || 'startTime',
        sortOrder: validatedQuery.sortOrder || 'desc'
      };

      const result = await timeslotService.listTimeslots(filters, pagination);

      res.json({
        success: true,
        data: result.timeslots,
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: result.totalPages
        }
      });
    } catch (error) {
      logger.error('Failed to list timeslots:', error);

      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: 'Invalid query parameters',
          details: error.errors
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  /**
   * Get active timeslots
   * GET /api/timeslots/active
   */
  async getActiveTimeslots(req: Request, res: Response): Promise<void> {
    try {
      const timeslots = await timeslotService.getActiveTimeslots();

      res.json({
        success: true,
        data: timeslots
      });
    } catch (error) {
      logger.error('Failed to get active timeslots:', error);

      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  /**
   * Get upcoming timeslots
   * GET /api/timeslots/upcoming
   */
  async getUpcomingTimeslots(req: Request, res: Response): Promise<void> {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      
      if (limit < 1 || limit > 50) {
        res.status(400).json({
          success: false,
          error: 'Limit must be between 1 and 50'
        });
        return;
      }

      const timeslots = await timeslotService.getUpcomingTimeslots(limit);

      res.json({
        success: true,
        data: timeslots
      });
    } catch (error) {
      logger.error('Failed to get upcoming timeslots:', error);

      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  /**
   * Update timeslot (admin only)
   * PUT /api/timeslots/:id
   */
  async updateTimeslot(req: Request, res: Response): Promise<void> {
    try {
      const walletAddress = req.user?.walletAddress;
      if (!walletAddress) {
        res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
        return;
      }

      const { id } = req.params;
      if (!id) {
        res.status(400).json({
          success: false,
          error: 'Timeslot ID is required'
        });
        return;
      }

      // Validate request body
      const validatedData = updateTimeslotSchema.parse(req.body);

      const timeslot = await timeslotService.updateTimeslot(id, validatedData, walletAddress);

      logger.info('Timeslot updated successfully', {
        timeslotId: id,
        updaterWallet: walletAddress.substring(0, 8) + '...'
      });

      res.json({
        success: true,
        data: timeslot
      });
    } catch (error) {
      logger.error('Failed to update timeslot:', error);

      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: 'Invalid request data',
          details: error.errors
        });
        return;
      }

      if (error instanceof NotFoundError) {
        res.status(404).json({
          success: false,
          error: error.message
        });
        return;
      }

      if (error instanceof ValidationError) {
        res.status(400).json({
          success: false,
          error: error.message
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  /**
   * Seal timeslot (stop accepting new bids/supplies)
   * PUT /api/timeslots/:id/seal
   */
  async sealTimeslot(req: Request, res: Response): Promise<void> {
    try {
      const walletAddress = req.user?.walletAddress;
      if (!walletAddress) {
        res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
        return;
      }

      const { id } = req.params;
      if (!id) {
        res.status(400).json({
          success: false,
          error: 'Timeslot ID is required'
        });
        return;
      }

      const timeslot = await timeslotService.sealTimeslot(id, walletAddress);

      logger.info('Timeslot sealed successfully', {
        timeslotId: id,
        sealerWallet: walletAddress.substring(0, 8) + '...'
      });

      res.json({
        success: true,
        data: timeslot
      });
    } catch (error) {
      logger.error('Failed to seal timeslot:', error);

      if (error instanceof NotFoundError) {
        res.status(404).json({
          success: false,
          error: error.message
        });
        return;
      }

      if (error instanceof ValidationError) {
        res.status(400).json({
          success: false,
          error: error.message
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  /**
   * Settle timeslot (finalize clearing price and allocations)
   * PUT /api/timeslots/:id/settle
   */
  async settleTimeslot(req: Request, res: Response): Promise<void> {
    try {
      const walletAddress = req.user?.walletAddress;
      if (!walletAddress) {
        res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
        return;
      }

      const { id } = req.params;
      if (!id) {
        res.status(400).json({
          success: false,
          error: 'Timeslot ID is required'
        });
        return;
      }

      const timeslot = await timeslotService.settleTimeslot(id, walletAddress);

      logger.info('Timeslot settled successfully', {
        timeslotId: id,
        settlerWallet: walletAddress.substring(0, 8) + '...'
      });

      res.json({
        success: true,
        data: timeslot
      });
    } catch (error) {
      logger.error('Failed to settle timeslot:', error);

      if (error instanceof NotFoundError) {
        res.status(404).json({
          success: false,
          error: error.message
        });
        return;
      }

      if (error instanceof ValidationError) {
        res.status(400).json({
          success: false,
          error: error.message
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  /**
   * Cancel timeslot (admin only)
   * DELETE /api/timeslots/:id
   */
  async cancelTimeslot(req: Request, res: Response): Promise<void> {
    try {
      const walletAddress = req.user?.walletAddress;
      if (!walletAddress) {
        res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
        return;
      }

      const { id } = req.params;
      if (!id) {
        res.status(400).json({
          success: false,
          error: 'Timeslot ID is required'
        });
        return;
      }

      const timeslot = await timeslotService.cancelTimeslot(id, walletAddress);

      logger.info('Timeslot cancelled successfully', {
        timeslotId: id,
        cancellerWallet: walletAddress.substring(0, 8) + '...'
      });

      res.json({
        success: true,
        data: timeslot
      });
    } catch (error) {
      logger.error('Failed to cancel timeslot:', error);

      if (error instanceof NotFoundError) {
        res.status(404).json({
          success: false,
          error: error.message
        });
        return;
      }

      if (error instanceof ValidationError) {
        res.status(400).json({
          success: false,
          error: error.message
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  /**
   * Get timeslot statistics
   * GET /api/timeslots/:id/stats
   */
  async getTimeslotStats(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      if (!id) {
        res.status(400).json({
          success: false,
          error: 'Timeslot ID is required'
        });
        return;
      }

      const stats = await timeslotService.getTimeslotStats(id);

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      logger.error('Failed to get timeslot stats:', error);

      if (error instanceof NotFoundError) {
        res.status(404).json({
          success: false,
          error: error.message
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
}

export const timeslotController = new TimeslotController();
