import { Request, Response } from 'express';
import { supplyService } from '@/services/supply.service';
import { logger } from '@/utils/logger';
import { ValidationError } from '@/utils/errors';
import { asyncHandler } from '@/middleware/error.middleware';
import { z } from 'zod';

// Validation schemas
const placeSupplySchema = z.object({
  timeslotId: z.string().min(1, 'Timeslot ID is required'),
  price: z.number().positive('Price must be positive'),
  quantity: z.number().positive('Quantity must be positive')
});

const getSuppliesQuerySchema = z.object({
  page: z.string().optional().default('1').transform(Number),
  limit: z.string().optional().default('10').transform(Number),
  sortBy: z.string().optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  status: z.enum(['PENDING', 'CONFIRMED', 'MATCHED', 'CANCELLED', 'EXPIRED']).optional(),
  timeslotId: z.string().optional(),
  priceFrom: z.string().optional().transform(val => val ? Number(val) : undefined),
  priceTo: z.string().optional().transform(val => val ? Number(val) : undefined)
});

export class SupplyController {
  /**
   * POST /api/supplies - Place new supply offer (authenticated wallet required)
   */
  placeSupply = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const user = (req as any).user;
    if (!user) {
      throw new ValidationError('Authentication required');
    }

    // Validate request body
    const validatedData = placeSupplySchema.parse(req.body);

    const supply = await supplyService.placeSupply(
      validatedData,
      user.walletAddress,
      user.id
    );

    logger.info('Supply offer placed successfully', {
      supplyId: supply.id,
      userId: user.id,
      timeslotId: validatedData.timeslotId
    });

    res.status(201).json({
      success: true,
      message: 'Supply offer placed successfully',
      data: {
        supply: {
          id: supply.id,
          timeslotId: supply.timeslotId,
          reservePrice: Number(supply.reservePrice),
          quantity: Number(supply.quantity),
          status: supply.status,
          txSignature: supply.txSignature,
          createdAt: supply.createdAt,
          updatedAt: supply.updatedAt
        }
      }
    });
  });

  /**
   * GET /api/supplies/:id - Get supply details (owner or admin only)
   */
  getSupplyById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const user = (req as any).user;
    const { id } = req.params;

    const supply = await supplyService.getSupplyById(id, user?.id);

    res.json({
      success: true,
      data: {
        supply: {
          id: supply.id,
          timeslotId: supply.timeslotId,
          reservePrice: Number(supply.reservePrice),
          quantity: Number(supply.quantity),
          status: supply.status,
          txSignature: supply.txSignature,
          escrowAccount: supply.escrowAccount,
          createdAt: supply.createdAt,
          updatedAt: supply.updatedAt,
          user: {
            id: supply.user.id,
            walletAddress: supply.user.walletAddress
          },
          timeslot: {
            id: supply.timeslot.id,
            startTime: supply.timeslot.startTime,
            endTime: supply.timeslot.endTime,
            status: supply.timeslot.status,
            totalEnergy: Number(supply.timeslot.totalEnergy)
          }
        }
      }
    });
  });

  /**
   * GET /api/my/supplies - Get current user's supply offers
   */
  getMySupplies = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const user = (req as any).user;
    if (!user) {
      throw new ValidationError('Authentication required');
    }

    // Validate query parameters
    const query = getSuppliesQuerySchema.parse(req.query);

    const filters = {
      status: query.status,
      timeslotId: query.timeslotId,
      priceFrom: query.priceFrom,
      priceTo: query.priceTo
    };

    const pagination = {
      page: query.page,
      limit: Math.min(query.limit, 100), // Cap at 100 items per page
      sortBy: query.sortBy,
      sortOrder: query.sortOrder
    };

    const result = await supplyService.getUserSupplies(user.id, filters, pagination);

    res.json({
      success: true,
      data: {
        supplies: result.supplies.map((supply: any) => ({
          id: supply.id,
          timeslotId: supply.timeslotId,
          reservePrice: Number(supply.reservePrice),
          quantity: Number(supply.quantity),
          status: supply.status,
          txSignature: supply.txSignature,
          createdAt: supply.createdAt,
          updatedAt: supply.updatedAt,
          timeslot: {
            id: supply.timeslot.id,
            startTime: supply.timeslot.startTime,
            endTime: supply.timeslot.endTime,
            status: supply.timeslot.status
          }
        })),
        pagination: {
          page: result.pagination.page,
          limit: result.pagination.limit,
          total: result.pagination.total,
          totalPages: result.pagination.totalPages
        }
      }
    });
  });

  /**
   * DELETE /api/supplies/:id - Cancel supply offer (owner only)
   */
  cancelSupply = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const user = (req as any).user;
    if (!user) {
      throw new ValidationError('Authentication required');
    }

    const { id } = req.params;

    const cancelledSupply = await supplyService.cancelSupply(id, user.id, user.walletAddress);

    logger.info('Supply offer cancelled successfully', {
      supplyId: id,
      userId: user.id
    });

    res.json({
      success: true,
      message: 'Supply offer cancelled successfully',
      data: {
        supply: {
          id: cancelledSupply.id,
          status: cancelledSupply.status,
          updatedAt: cancelledSupply.updatedAt
        }
      }
    });
  });

  /**
   * GET /api/timeslots/:id/supplies - Get supply offers for timeslot (paginated)
   */
  getTimeslotSupplies = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id: timeslotId } = req.params;

    // Validate query parameters
    const query = getSuppliesQuerySchema.parse(req.query);

    const pagination = {
      page: query.page,
      limit: Math.min(query.limit, 100),
      sortBy: query.sortBy,
      sortOrder: query.sortOrder
    };

    const result = await supplyService.getTimeslotSupplies(timeslotId, pagination);

    res.json({
      success: true,
      data: {
        timeslotId,
        supplies: result.supplies.map((supply: any) => ({
          id: supply.id,
          reservePrice: Number(supply.reservePrice),
          quantity: Number(supply.quantity),
          status: supply.status,
          createdAt: supply.createdAt,
          user: {
            id: supply.user.id,
            walletAddress: supply.user.walletAddress
          }
        })),
        pagination: {
          page: result.pagination.page,
          limit: result.pagination.limit,
          total: result.pagination.total,
          totalPages: result.pagination.totalPages
        }
      }
    });
  });

  /**
   * GET /api/timeslots/:id/supplies/stats - Get supply statistics for timeslot
   */
  getTimeslotSupplyStats = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id: timeslotId } = req.params;

    const stats = await supplyService.getSupplyStatistics(timeslotId);

    res.json({
      success: true,
      data: {
        timeslotId,
        statistics: stats
      }
    });
  });

  /**
   * PUT /api/supplies/:id/status - Update supply status (internal use for blockchain events)
   */
  updateSupplyStatus = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    // This endpoint would typically be called by internal blockchain event handlers
    // For now, we'll implement it but it should be protected by admin authentication
    const { id } = req.params;
    const { status, txSignature } = req.body;

    if (!status || !['PENDING', 'CONFIRMED', 'MATCHED', 'CANCELLED', 'EXPIRED'].includes(status)) {
      throw new ValidationError('Valid status is required');
    }

    const updatedSupply = await supplyService.updateSupplyStatus(id, status, txSignature);

    logger.info('Supply status updated', {
      supplyId: id,
      status,
      txSignature
    });

    res.json({
      success: true,
      message: 'Supply status updated successfully',
      data: {
        supply: {
          id: updatedSupply.id,
          status: updatedSupply.status,
          txSignature: updatedSupply.txSignature,
          updatedAt: updatedSupply.updatedAt
        }
      }
    });
  });
}

export const supplyController = new SupplyController();
