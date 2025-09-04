import { prismaService } from '@/database/prisma.service';
import { blockchainService } from './blockchain.service';
import { blockchainTransactionService } from './blockchain-transaction.service';
import { logger } from '@/utils/logger';
import { ValidationError, NotFoundError, ConflictError } from '@/utils/errors';

interface CreateSupplyData {
  timeslotId: string;
  price: number;
  quantity: number;
}

interface SupplyFilters {
  status?: 'PENDING' | 'COMMITTED' | 'CONFIRMED' | 'ALLOCATED' | 'DELIVERED' | 'CANCELLED' | 'MATCHED' | 'EXPIRED';
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

export class SupplyService {
  /**
   * Place a new supply offer
   */
  async placeSupply(data: CreateSupplyData, walletAddress: string, userId: string) {
    try {
      // Validate input data
      if (data.price <= 0) {
        throw new ValidationError('Supply price must be positive');
      }

      if (data.quantity <= 0) {
        throw new ValidationError('Supply quantity must be positive');
      }

      // Get timeslot and validate it's open for supply offers
      const timeslot = await prismaService.findTimeslotById(data.timeslotId);
      if (!timeslot) {
        throw new NotFoundError(`Timeslot with ID ${data.timeslotId} not found`);
      }

      if ((timeslot as any).status !== 'OPEN') {
        throw new ValidationError(`Cannot offer supply for timeslot with status: ${(timeslot as any).status}`);
      }

      const now = new Date();
      if ((timeslot as any).endTime <= now) {
        throw new ValidationError('Cannot offer supply for expired timeslot');
      }

      // Check for duplicate supply offers from same user for same timeslot
      const existingSupply = await prismaService.client.supply.findFirst({
        where: {
          userId,
          timeslotId: data.timeslotId,
          status: {
            in: ['COMMITTED', 'CONFIRMED']
          }
        }
      });

      if (existingSupply) {
        throw new ConflictError('You already have an active supply offer for this timeslot');
      }

      // Validate wallet balance using production-grade blockchain service
      const hasBalance = await this.validateWalletBalance(walletAddress, data.quantity);
      if (!hasBalance) {
        throw new ValidationError('Insufficient wallet balance for supply offer');
      }

      // Prepare blockchain transaction
      const txSignature = await this.prepareSupplyTransaction(data, walletAddress);

      // Create supply offer in database
      const supply = await prismaService.client.supply.create({
        data: {
          userId,
          timeslotId: data.timeslotId,
          reservePrice: data.price,
          quantity: data.quantity,
          status: 'COMMITTED',
          txSignature,
          escrowAccount: null, // Will be set when blockchain transaction is confirmed
          createdAt: new Date(),
          updatedAt: new Date()
        },
        include: {
          user: true,
          timeslot: true
        }
      });

      logger.info('Supply offer placed successfully', {
        supplyId: supply.id,
        userId,
        timeslotId: data.timeslotId,
        price: data.price,
        quantity: data.quantity
      });

      return supply;
    } catch (error) {
      logger.error('Failed to place supply offer:', error);
      throw error;
    }
  }

  /**
   * Get supply offer by ID
   */
  async getSupplyById(id: string, requestingUserId?: string) {
    try {
      const supply = await prismaService.client.supply.findUnique({
        where: { id },
        include: {
          user: true,
          timeslot: true
        }
      });

      if (!supply) {
        throw new NotFoundError(`Supply offer with ID ${id} not found`);
      }

      // Check if user has permission to view this supply offer
      if (requestingUserId && supply.userId !== requestingUserId) {
        // Production: Allow viewing all supply offers for market transparency
        logger.info('User viewing supply offer', {
          requestingUserId,
          supplyOwnerId: supply.userId,
          supplyId: id
        });
      }

      return supply;
    } catch (error) {
      logger.error('Failed to get supply offer by ID:', error);
      throw error;
    }
  }

  /**
   * Get user's supply offers with filtering and pagination
   */
  async getUserSupplies(userId: string, filters: SupplyFilters, pagination: PaginationOptions) {
    try {
      const where: any = { userId };

      // Apply filters
      if (filters.status) {
        where.status = filters.status;
      }

      if (filters.timeslotId) {
        where.timeslotId = filters.timeslotId;
      }

      if (filters.priceFrom || filters.priceTo) {
        where.price = {};
        if (filters.priceFrom) {
          where.price.gte = filters.priceFrom;
        }
        if (filters.priceTo) {
          where.price.lte = filters.priceTo;
        }
      }

      // Calculate pagination
      const skip = (pagination.page - 1) * pagination.limit;

      // Get total count
      const total = await prismaService.client.supply.count({ where });

      // Get supplies
      const supplies = await prismaService.client.supply.findMany({
        where,
        include: {
          timeslot: true
        },
        orderBy: {
          [pagination.sortBy]: pagination.sortOrder
        },
        skip,
        take: pagination.limit
      });

      const totalPages = Math.ceil(total / pagination.limit);

      return {
        supplies,
        pagination: {
          page: pagination.page,
          limit: pagination.limit,
          total,
          totalPages
        }
      };
    } catch (error) {
      logger.error('Failed to get user supply offers:', error);
      throw error;
    }
  }

  /**
   * Get supply offers for a specific timeslot
   */
  async getTimeslotSupplies(timeslotId: string, pagination: PaginationOptions) {
    try {
      const where = { timeslotId };

      // Calculate pagination
      const skip = (pagination.page - 1) * pagination.limit;

      // Get total count
      const total = await prismaService.client.supply.count({ where });

      // Get supplies
      const supplies = await prismaService.client.supply.findMany({
        where,
        include: {
          user: true
        },
        orderBy: {
          [pagination.sortBy]: pagination.sortOrder
        },
        skip,
        take: pagination.limit
      });

      const totalPages = Math.ceil(total / pagination.limit);

      return {
        supplies,
        pagination: {
          page: pagination.page,
          limit: pagination.limit,
          total,
          totalPages
        }
      };
    } catch (error) {
      logger.error('Failed to get timeslot supply offers:', error);
      throw error;
    }
  }

  /**
   * Cancel supply offer
   */
  async cancelSupply(supplyId: string, userId: string, walletAddress: string) {
    try {
      // Get supply offer
      const supply = await prismaService.client.supply.findUnique({
        where: { id: supplyId },
        include: { timeslot: true }
      });

      if (!supply) {
        throw new NotFoundError(`Supply offer with ID ${supplyId} not found`);
      }

      // Check ownership
      if (supply.userId !== userId) {
        throw new ValidationError('You can only cancel your own supply offers');
      }

      // Check if supply can be cancelled
      if (supply.status === 'CANCELLED') {
        throw new ConflictError('Supply offer is already cancelled');
      }

      if (supply.status === 'ALLOCATED' || supply.status === 'DELIVERED') {
        throw new ConflictError('Cannot cancel matched supply offer');
      }

      // Additional validation can be added here if needed

      // Prepare blockchain cancellation transaction
      const cancelTxSignature = await this.prepareCancelSupplyTransaction(supply, walletAddress);

      // Update supply status
      const cancelledSupply = await prismaService.client.supply.update({
        where: { id: supplyId },
        data: {
          status: 'CANCELLED',
          txSignature: cancelTxSignature,
          updatedAt: new Date()
        },
        include: {
          user: true,
          timeslot: true
        }
      });

      logger.info('Supply offer cancelled successfully', {
        supplyId,
        userId,
        cancelTxSignature
      });

      return cancelledSupply;
    } catch (error) {
      logger.error('Failed to cancel supply offer:', error);
      throw error;
    }
  }

  /**
   * Update supply status (internal use for blockchain events)
   */
  async updateSupplyStatus(supplyId: string, status: 'COMMITTED' | 'CONFIRMED' | 'MATCHED' | 'CANCELLED' | 'EXPIRED', txSignature?: string) {
    try {
      const updateData: any = { status, updatedAt: new Date() };
      if (txSignature) {
        updateData.txSignature = txSignature;
      }

      const supply = await prismaService.client.supply.update({
        where: { id: supplyId },
        data: updateData,
        include: {
          user: true,
          timeslot: true
        }
      });

      logger.info('Supply status updated', {
        supplyId,
        status,
        txSignature
      });

      return supply;
    } catch (error) {
      logger.error('Failed to update supply status:', error);
      throw error;
    }
  }

  /**
   * Get supply statistics for a timeslot
   */
  async getSupplyStatistics(timeslotId: string) {
    try {
      const stats = await prismaService.client.supply.aggregate({
        where: { timeslotId },
        _count: {
          id: true
        },
        _sum: {
          quantity: true
        },
        _avg: {
          reservePrice: true
        },
        _min: {
          reservePrice: true
        },
        _max: {
          reservePrice: true
        }
      });

      const statusCounts = await prismaService.client.supply.groupBy({
        by: ['status'],
        where: { timeslotId },
        _count: {
          id: true
        }
      });

      const statusCountsMap = statusCounts.reduce((acc: any, item: any) => {
        acc[item.status] = item._count.id;
        return acc;
      }, {});

      return {
        totalOffers: stats._count?.id || 0,
        totalQuantity: Number(stats._sum?.quantity || 0),
        averagePrice: Number(stats._avg?.reservePrice || 0),
        minPrice: Number(stats._min?.reservePrice || 0),
        maxPrice: Number(stats._max?.reservePrice || 0),
        statusCounts: statusCountsMap
      };
    } catch (error) {
      logger.error('Failed to get supply statistics:', error);
      throw error;
    }
  }

  /**
   * Validate wallet balance using production-grade blockchain service
   */
  private async validateWalletBalance(walletAddress: string, requiredQuantity: number): Promise<boolean> {
    try {
      // Production implementation: Check actual energy tokens in the wallet
      const balance = await blockchainService.getAccountBalance(walletAddress);
      if (!(balance as any).success) {
        logger.warn('Failed to retrieve wallet balance', { walletAddress });
        return false;
      }
      
      const walletBalance = (balance as any).data.balance || 0;
      const hasBalance = walletBalance >= requiredQuantity;
      
      logger.info('Wallet balance validation for supply', {
        walletAddress,
        requiredQuantity,
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
   * Prepare blockchain transaction for supply offer
   */
  private async prepareSupplyTransaction(supply: CreateSupplyData, userWallet: string): Promise<string> {
    return await blockchainTransactionService.prepareSupplyTransaction(supply, userWallet);
  }

  /**
   * Prepare blockchain transaction for supply cancellation
   */
  private async prepareCancelSupplyTransaction(supply: { id: string; timeslotId: string }, userWallet: string): Promise<string> {
    return await blockchainTransactionService.prepareCancelSupplyTransaction(supply, userWallet);
  }
}

export const supplyService = new SupplyService();
