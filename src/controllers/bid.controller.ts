import { Request, Response } from 'express';
import { bidService } from '@/services/bid.service';
import { logger } from '@/utils/logger';
import { ValidationError } from '@/utils/errors';
import { asyncHandler } from '@/middleware/error.middleware';
import { z } from 'zod';

// Validation schemas
const placeBidSchema = z.object({
  timeslotId: z.string().min(1, 'Timeslot ID is required'),
  price: z.number().positive('Price must be positive'),
  quantity: z.number().positive('Quantity must be positive')
});

const getBidsQuerySchema = z.object({
  page: z.string().optional().default('1').transform(Number),
  limit: z.string().optional().default('10').transform(Number),
  sortBy: z.string().optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  status: z.enum(['PENDING', 'CONFIRMED', 'MATCHED', 'CANCELLED', 'EXPIRED']).optional(),
  timeslotId: z.string().optional(),
  priceFrom: z.string().optional().transform(val => val ? Number(val) : undefined),
  priceTo: z.string().optional().transform(val => val ? Number(val) : undefined)
});

export class BidController {
  /**
   * POST /api/bids - Place new bid (authenticated wallet required)
   */
  placeBid = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const user = (req as any).user;
    if (!user) {
      throw new ValidationError('Authentication required');
    }

    // Validate request body
    const validatedData = placeBidSchema.parse(req.body);

    const bid = await bidService.placeBid(
      validatedData,
      user.walletAddress,
      user.id
    );

    logger.info('Bid placed successfully', {
      bidId: bid.id,
      userId: user.id,
      timeslotId: validatedData.timeslotId
    });

    res.status(201).json({
      success: true,
      message: 'Bid placed successfully',
      data: {
        bid: {
          id: bid.id,
          timeslotId: bid.timeslotId,
          price: Number(bid.price),
          quantity: Number(bid.quantity),
          status: bid.status,
          txSignature: bid.txSignature,
          createdAt: bid.createdAt,
          updatedAt: bid.updatedAt,
          timeslot: {
            id: bid.timeslot.id,
            startTime: bid.timeslot.startTime,
            endTime: bid.timeslot.endTime,
            status: bid.timeslot.status
          }
        }
      }
    });
  });

  /**
   * GET /api/bids/:id - Get bid details (owner or admin only)
   */
  getBidById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const user = (req as any).user;
    const { id } = req.params;

    const bid = await bidService.getBidById(id, user?.id);

    res.json({
      success: true,
      data: {
        bid: {
          id: bid.id,
          timeslotId: bid.timeslotId,
          price: Number(bid.price),
          quantity: Number(bid.quantity),
          status: bid.status,
          txSignature: bid.txSignature,
          escrowAccount: bid.escrowAccount,
          createdAt: bid.createdAt,
          updatedAt: bid.updatedAt,
          user: {
            id: bid.user.id,
            walletAddress: bid.user.walletAddress
          },
          timeslot: {
            id: bid.timeslot.id,
            startTime: bid.timeslot.startTime,
            endTime: bid.timeslot.endTime,
            status: bid.timeslot.status,
            totalEnergy: Number(bid.timeslot.totalEnergy)
          }
        }
      }
    });
  });

  /**
   * GET /api/my/bids - Get current user's bids
   */
  getMyBids = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const user = (req as any).user;
    if (!user) {
      throw new ValidationError('Authentication required');
    }

    // Validate query parameters
    const query = getBidsQuerySchema.parse(req.query);

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

    const result = await bidService.getUserBids(user.id, filters, pagination);

    res.json({
      success: true,
      data: {
        bids: result.bids.map((bid: any) => ({
          id: bid.id,
          timeslotId: bid.timeslotId,
          price: Number(bid.price),
          quantity: Number(bid.quantity),
          status: bid.status,
          txSignature: bid.txSignature,
          createdAt: bid.createdAt,
          updatedAt: bid.updatedAt,
          timeslot: {
            id: bid.timeslot.id,
            startTime: bid.timeslot.startTime,
            endTime: bid.timeslot.endTime,
            status: bid.timeslot.status
          }
        })),
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: result.totalPages
        }
      }
    });
  });

  /**
   * DELETE /api/bids/:id - Cancel bid (owner only)
   */
  cancelBid = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const user = (req as any).user;
    if (!user) {
      throw new ValidationError('Authentication required');
    }

    const { id } = req.params;

    const cancelledBid = await bidService.cancelBid(id, user.id, user.walletAddress);

    logger.info('Bid cancelled successfully', {
      bidId: id,
      userId: user.id
    });

    res.json({
      success: true,
      message: 'Bid cancelled successfully',
      data: {
        bid: {
          id: cancelledBid.id,
          status: cancelledBid.status,
          updatedAt: cancelledBid.updatedAt
        }
      }
    });
  });

  /**
   * GET /api/timeslots/:id/bids - Get bids for timeslot (paginated)
   */
  getTimeslotBids = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id: timeslotId } = req.params;

    // Validate query parameters
    const query = getBidsQuerySchema.parse(req.query);

    const pagination = {
      page: query.page,
      limit: Math.min(query.limit, 100),
      sortBy: query.sortBy,
      sortOrder: query.sortOrder
    };

    const result = await bidService.getTimeslotBids(timeslotId, pagination);

    res.json({
      success: true,
      data: {
        timeslotId,
        bids: result.bids.map((bid: any) => ({
          id: bid.id,
          price: Number(bid.price),
          quantity: Number(bid.quantity),
          status: bid.status,
          createdAt: bid.createdAt,
          user: {
            id: bid.user.id,
            walletAddress: bid.user.walletAddress
          }
        })),
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: result.totalPages
        }
      }
    });
  });

  /**
   * GET /api/timeslots/:id/bids/stats - Get bid statistics for timeslot
   */
  getTimeslotBidStats = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id: timeslotId } = req.params;

    const stats = await bidService.getBidStatistics(timeslotId);

    res.json({
      success: true,
      data: {
        timeslotId,
        statistics: stats
      }
    });
  });

  /**
   * PUT /api/bids/:id/status - Update bid status (internal use for blockchain events)
   */
  updateBidStatus = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    // This endpoint would typically be called by internal blockchain event handlers
    // For now, we'll implement it but it should be protected by admin authentication
    const { id } = req.params;
    const { status, txSignature } = req.body;

    if (!status || !['PENDING', 'CONFIRMED', 'MATCHED', 'CANCELLED', 'EXPIRED'].includes(status)) {
      throw new ValidationError('Valid status is required');
    }

    const updatedBid = await bidService.updateBidStatus(id, status, txSignature);

    logger.info('Bid status updated', {
      bidId: id,
      status,
      txSignature
    });

    res.json({
      success: true,
      message: 'Bid status updated successfully',
      data: {
        bid: {
          id: updatedBid.id,
          status: updatedBid.status,
          txSignature: updatedBid.txSignature,
          updatedAt: updatedBid.updatedAt
        }
      }
    });
  });
}

export const bidController = new BidController();
