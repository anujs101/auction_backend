import { prismaService } from '@/database/prisma.service';
import { blockchainService } from './blockchain.service';
import { blockchainTransactionService } from './blockchain-transaction.service';
import { logger } from '@/utils/logger';
import { ValidationError, NotFoundError, ConflictError } from '@/utils/errors';
interface CreateBidData {
  timeslotId: string;
  price: number;
  quantity: number;
}

interface BidFilters {
  status?: 'PENDING' | 'CONFIRMED' | 'MATCHED' | 'CANCELLED' | 'EXPIRED';
  timeslotId?: string;
  userId?: string;
  priceFrom?: number;
  priceTo?: number;
}

interface PaginationOptions {
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export class BidService {
  /**
   * Place a new bid with wallet integration
   */
  async placeBid(data: CreateBidData, userWallet: string, userId: string) {
    try {
      // Validate input
      if (data.price <= 0) {
        throw new ValidationError('Bid price must be positive');
      }

      if (data.quantity <= 0) {
        throw new ValidationError('Bid quantity must be positive');
      }

      // Get timeslot and validate it's open for bidding
      const timeslot = await prismaService.findTimeslotById(data.timeslotId);
      if (!timeslot) {
        throw new NotFoundError(`Timeslot with ID ${data.timeslotId} not found`);
      }

      if ((timeslot as any).status !== 'OPEN') {
        throw new ValidationError(`Cannot bid on timeslot with status: ${(timeslot as any).status}`);
      }

      const now = new Date();
      if ((timeslot as any).endTime <= now) {
        throw new ValidationError('Cannot bid on expired timeslot');
      }

      // Check for duplicate bids from same user for same timeslot
      const existingBid = await prismaService.client.bid.findFirst({
        where: {
          userId,
          timeslotId: data.timeslotId,
          status: {
            in: ['PENDING', 'CONFIRMED']
          }
        }
      });

      if (existingBid) {
        throw new ConflictError('User already has an active bid for this timeslot');
      }

      // Validate wallet balance using production-grade blockchain service
      const hasBalance = await this.validateWalletBalance(userWallet, data.price * data.quantity);
      if (!hasBalance) {
        throw new ValidationError('Insufficient wallet balance for bid');
      }

      // Create bid in database
      const bid = await prismaService.client.bid.create({
        data: {
          userId,
          timeslotId: data.timeslotId,
          price: data.price,
          quantity: data.quantity,
          status: 'PENDING'
        },
        include: {
          user: true,
          timeslot: true
        }
      });

      // Prepare blockchain transaction using production-grade service
      try {
        const txSignature = await this.prepareBidTransaction(bid, userWallet);
        
        // Update bid with transaction signature
        const updatedBid = await prismaService.client.bid.update({
          where: { id: bid.id },
          data: { 
            txSignature,
            status: 'CONFIRMED'
          },
          include: {
            user: true,
            timeslot: true
          }
        });

        logger.info('Bid placed successfully', {
          bidId: bid.id,
          timeslotId: data.timeslotId,
          userWallet: userWallet.substring(0, 8) + '...',
          price: data.price,
          quantity: data.quantity
        });

        return updatedBid;
      } catch (blockchainError) {
        // If blockchain transaction fails, mark bid as failed but keep record
        await prismaService.client.bid.update({
          where: { id: bid.id },
          data: { status: 'CANCELLED' }
        });
        
        logger.error('Blockchain transaction failed for bid', {
          bidId: bid.id,
          error: blockchainError
        });
        
        throw new ValidationError('Failed to process bid on blockchain');
      }
    } catch (error) {
      logger.error('Failed to place bid:', error);
      throw error;
    }
  }

  /**
   * Get bid by ID with ownership validation
   */
  async getBidById(id: string, requestingUserId?: string) {
    try {
      const bid = await prismaService.client.bid.findUnique({
        where: { id },
        include: {
          user: true,
          timeslot: true
        }
      });

      if (!bid) {
        throw new NotFoundError(`Bid with ID ${id} not found`);
      }

      // Only bid owner or admin can view bid details
      if (requestingUserId && bid.userId !== requestingUserId) {
        throw new ValidationError('Access denied: can only view your own bids');
      }

      return bid;
    } catch (error) {
      logger.error('Failed to get bid by ID:', error);
      throw error;
    }
  }

  /**
   * Get user's bids with filtering and pagination
   */
  async getUserBids(userId: string, filters: BidFilters, pagination: PaginationOptions) {
    try {
      const where: any = { userId };

      if (filters.status) {
        where.status = filters.status;
      }

      if (filters.timeslotId) {
        where.timeslotId = filters.timeslotId;
      }

      if (filters.priceFrom || filters.priceTo) {
        where.price = {};
        if (filters.priceFrom) where.price.gte = filters.priceFrom;
        if (filters.priceTo) where.price.lte = filters.priceTo;
      }

      const [bids, total] = await Promise.all([
        prismaService.client.bid.findMany({
          where,
          include: {
            timeslot: true
          },
          orderBy: { [pagination.sortBy]: pagination.sortOrder },
          skip: (pagination.page - 1) * pagination.limit,
          take: pagination.limit
        }),
        prismaService.client.bid.count({ where })
      ]);

      return {
        bids,
        total,
        page: pagination.page,
        limit: pagination.limit,
        totalPages: Math.ceil(total / pagination.limit)
      };
    } catch (error) {
      logger.error('Failed to get user bids:', error);
      throw error;
    }
  }

  /**
   * Get bids for a specific timeslot
   */
  async getTimeslotBids(timeslotId: string, pagination: PaginationOptions) {
    try {
      // Verify timeslot exists
      const timeslot = await prismaService.findTimeslotById(timeslotId);
      if (!timeslot) {
        throw new NotFoundError(`Timeslot with ID ${timeslotId} not found`);
      }

      const [bids, total] = await Promise.all([
        prismaService.client.bid.findMany({
          where: { 
            timeslotId,
            status: {
              in: ['CONFIRMED', 'MATCHED']
            }
          },
          include: {
            user: {
              select: {
                id: true,
                walletAddress: true
              }
            }
          },
          orderBy: { [pagination.sortBy]: pagination.sortOrder },
          skip: (pagination.page - 1) * pagination.limit,
          take: pagination.limit
        }),
        prismaService.client.bid.count({ 
          where: { 
            timeslotId,
            status: {
              in: ['CONFIRMED', 'MATCHED']
            }
          }
        })
      ]);

      return {
        bids,
        total,
        page: pagination.page,
        limit: pagination.limit,
        totalPages: Math.ceil(total / pagination.limit)
      };
    } catch (error) {
      logger.error('Failed to get timeslot bids:', error);
      throw error;
    }
  }

  /**
   * Cancel a bid (only by owner)
   */
  async cancelBid(id: string, userId: string, userWallet: string) {
    try {
      const bid = await this.getBidById(id, userId);

      if (bid.status !== 'PENDING' && bid.status !== 'CONFIRMED') {
        throw new ValidationError(`Cannot cancel bid with status: ${bid.status}`);
      }

      // Check if timeslot is still open
      if (bid.timeslot.status !== 'OPEN') {
        throw new ValidationError('Cannot cancel bid after timeslot is sealed');
      }

      // Update bid status
      const cancelledBid = await prismaService.client.bid.update({
        where: { id },
        data: { 
          status: 'CANCELLED',
          updatedAt: new Date()
        },
        include: {
          user: true,
          timeslot: true
        }
      });

      // Blockchain transaction cancellation handled by the transaction service
      
      logger.info('Bid cancelled successfully', {
        bidId: id,
        userWallet: userWallet.substring(0, 8) + '...'
      });

      return cancelledBid;
    } catch (error) {
      logger.error('Failed to cancel bid:', error);
      throw error;
    }
  }

  /**
   * Update bid status (internal use for blockchain events)
   */
  async updateBidStatus(bidId: string, status: 'PENDING' | 'CONFIRMED' | 'MATCHED' | 'CANCELLED' | 'EXPIRED', txSignature?: string) {
    try {
      const updateData: any = { status, updatedAt: new Date() };
      if (txSignature) {
        updateData.txSignature = txSignature;
      }

      const bid = await prismaService.client.bid.update({
        where: { id: bidId },
        data: updateData,
        include: {
          user: true,
          timeslot: true
        }
      });

      logger.info('Bid status updated', {
        bidId,
        status,
        txSignature
      });

      return bid;
    } catch (error) {
      logger.error('Failed to update bid status:', error);
      throw error;
    }
  }

  /**
   * Get bid statistics for a timeslot
   */
  async getBidStatistics(timeslotId: string) {
    try {
      const stats = await prismaService.client.bid.aggregate({
        where: { 
          timeslotId,
          status: {
            in: ['CONFIRMED', 'MATCHED']
          }
        },
        _count: { id: true },
        _sum: { quantity: true },
        _avg: { price: true },
        _max: { price: true },
        _min: { price: true }
      });

      return {
        totalBids: stats._count.id || 0,
        totalQuantity: Number(stats._sum.quantity) || 0,
        averagePrice: Number(stats._avg.price) || 0,
        highestPrice: Number(stats._max.price) || 0,
        lowestPrice: Number(stats._min.price) || 0
      };
    } catch (error) {
      logger.error('Failed to get bid statistics:', error);
      throw error;
    }
  }

  /**
   * Validate wallet balance using production-grade blockchain service
   */
  private async validateWalletBalance(walletAddress: string, requiredAmount: number): Promise<boolean> {
    try {
      // Production implementation: Check actual Solana wallet balance
      const balance = await blockchainService.getAccountBalance(walletAddress);
      if (!(balance as any).success) {
        logger.warn('Failed to retrieve wallet balance', { walletAddress });
        return false;
      }
      
      const walletBalance = (balance as any).data.balance || 0;
      const hasBalance = walletBalance >= requiredAmount;
      
      logger.info('Wallet balance validation', {
        walletAddress,
        requiredAmount,
        walletBalance,
        hasBalance
      });
      
      return hasBalance;
    } catch (error) {
      logger.error('Error validating wallet balance:', error);
      return false;
    }
  }

  /**
   * Prepare blockchain transaction for bid
   */
  private async prepareBidTransaction(bid: any, userWallet: string): Promise<string> {
    return await blockchainTransactionService.prepareBidTransaction(bid, userWallet);
  }
}

export const bidService = new BidService();
