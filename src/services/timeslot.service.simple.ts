import { prismaService } from '@/database/prisma.service';
import { logger } from '@/utils/logger';
import { ValidationError, NotFoundError } from '@/utils/errors';
import { clearingPriceService } from './clearing-price.service';
import { TimeslotStatus } from '@prisma/client';

interface CreateTimeslotData {
  startTime: Date;
  endTime: Date;
  totalEnergy: number;
}

interface TimeslotFilters {
  status?: TimeslotStatus;
  startTimeFrom?: Date;
  startTimeTo?: Date;
}

interface PaginationOptions {
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export class TimeslotService {
  /**
   * Create a new timeslot
   */
  async createTimeslot(data: CreateTimeslotData, creatorWallet: string) {
    try {
      // Validate input
      if (data.startTime >= data.endTime) {
        throw new ValidationError('Start time must be before end time');
      }

      if (data.totalEnergy <= 0) {
        throw new ValidationError('Total energy must be positive');
      }

      const timeslot = await prismaService.createTimeslot({
        startTime: data.startTime,
        endTime: data.endTime,
        totalEnergy: data.totalEnergy,
        status: 'OPEN'
      });

      logger.info('Timeslot created successfully', {
        timeslotId: timeslot.id,
        creatorWallet: creatorWallet.substring(0, 8) + '...'
      });

      return timeslot;
    } catch (error) {
      logger.error('Failed to create timeslot:', error);
      throw error;
    }
  }

  /**
   * Get timeslot by ID
   */
  async getTimeslotById(id: string) {
    try {
      const timeslot = await prismaService.findTimeslotById(id);
      
      if (!timeslot) {
        throw new NotFoundError(`Timeslot with ID ${id} not found`);
      }

      return timeslot;
    } catch (error) {
      logger.error('Failed to get timeslot by ID:', error);
      throw error;
    }
  }

  /**
   * List timeslots with filtering and pagination
   */
  async listTimeslots(filters: TimeslotFilters, pagination: PaginationOptions) {
    try {
      const result = await prismaService.findTimeslots({
        filters,
        pagination: {
          offset: (pagination.page - 1) * pagination.limit,
          limit: pagination.limit,
          sortBy: pagination.sortBy,
          sortOrder: pagination.sortOrder
        }
      });

      return result;
    } catch (error) {
      logger.error('Failed to list timeslots:', error);
      throw error;
    }
  }

  /**
   * Get active timeslots
   */
  async getActiveTimeslots() {
    try {
      const now = new Date();
      const timeslots = await prismaService.client.timeslot.findMany({
        where: {
          status: 'OPEN',
          startTime: { lte: now },
          endTime: { gte: now }
        },
        orderBy: { startTime: 'asc' }
      });

      return timeslots;
    } catch (error) {
      logger.error('Failed to get active timeslots:', error);
      throw error;
    }
  }

  /**
   * Get upcoming timeslots
   */
  async getUpcomingTimeslots(limit: number = 10) {
    try {
      const now = new Date();
      const timeslots = await prismaService.client.timeslot.findMany({
        where: {
          startTime: { gt: now }
        },
        orderBy: { startTime: 'asc' },
        take: limit
      });

      return timeslots;
    } catch (error) {
      logger.error('Failed to get upcoming timeslots:', error);
      throw error;
    }
  }

  /**
   * Update timeslot
   */
  async updateTimeslot(id: string, updates: Partial<CreateTimeslotData>, updaterWallet: string) {
    try {
      const existingTimeslot = await this.getTimeslotById(id);
      
      if (existingTimeslot.status !== 'OPEN') {
        throw new ValidationError('Cannot update timeslot that is not open');
      }

      const timeslot = await prismaService.updateTimeslot(id, updates);

      logger.info('Timeslot updated successfully', {
        timeslotId: id,
        updaterWallet: updaterWallet.substring(0, 8) + '...'
      });

      return timeslot;
    } catch (error) {
      logger.error('Failed to update timeslot:', error);
      throw error;
    }
  }

  /**
   * Seal timeslot (stop accepting new bids/supplies)
   */
  async sealTimeslot(id: string, sealerWallet: string) {
    try {
      const existingTimeslot = await this.getTimeslotById(id);
      
      if (existingTimeslot.status !== 'OPEN') {
        throw new ValidationError('Can only seal open timeslots');
      }

      const timeslot = await prismaService.updateTimeslotStatus(id, 'SEALED');

      logger.info('Timeslot sealed successfully', {
        timeslotId: id,
        sealerWallet: sealerWallet.substring(0, 8) + '...'
      });

      return timeslot;
    } catch (error) {
      logger.error('Failed to seal timeslot:', error);
      throw error;
    }
  }

  /**
   * Settle timeslot (finalize clearing price and allocations)
   */
  async settleTimeslot(id: string, settlerWallet: string) {
    try {
      const existingTimeslot = await this.getTimeslotById(id);
      
      if (existingTimeslot.status !== 'SEALED') {
        throw new ValidationError('Can only settle sealed timeslots');
      }

      // Calculate clearing price using production-grade clearing service
      const clearingResult = await clearingPriceService.executeMarketClearing(id);
      const clearingPrice = clearingResult.clearingPrice;

      const timeslot = await prismaService.settleTimeslot(id, clearingPrice);

      logger.info('Timeslot settled successfully', {
        timeslotId: id,
        clearingPrice,
        settlerWallet: settlerWallet.substring(0, 8) + '...'
      });

      return timeslot;
    } catch (error) {
      logger.error('Failed to settle timeslot:', error);
      throw error;
    }
  }

  /**
   * Get timeslot statistics
   */
  async getTimeslotStats(id: string) {
    try {
      const timeslot = await this.getTimeslotById(id);
      
      // Get related bids and supplies
      const [bids, supplies] = await Promise.all([
        prismaService.client.bid.findMany({
          where: { timeslotId: id }
        }),
        prismaService.client.supply.findMany({
          where: { timeslotId: id }
        })
      ]);

      const totalBids = bids.length;
      const totalSupplies = supplies.length;
      const totalDemand = bids.reduce((sum, bid) => sum + Number(bid.quantity), 0);
      const totalSupply = supplies.reduce((sum, supply) => sum + Number(supply.quantity), 0);

      return {
        timeslot,
        totalBids,
        totalSupplies,
        totalDemand,
        totalSupply,
        averageBidPrice: bids.length > 0 ? bids.reduce((sum, bid) => sum + Number(bid.price), 0) / bids.length : 0,
        averageSupplyPrice: supplies.length > 0 ? supplies.reduce((sum, supply) => sum + Number(supply.reservePrice), 0) / supplies.length : 0
      };
    } catch (error) {
      logger.error('Failed to get timeslot stats:', error);
      throw error;
    }
  }
}

export const timeslotService = new TimeslotService();
