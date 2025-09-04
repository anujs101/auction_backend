import { logger } from '@/utils/logger';
import { prismaService } from '@/database/prisma.service';

interface BidData {
  id: string;
  price: number;
  quantity: number;
  userId: string;
}

interface SupplyData {
  id: string;
  reservePrice: number;
  quantity: number;
  userId: string;
}

interface ClearingResult {
  clearingPrice: number;
  totalVolume: number;
  matchedBids: Array<{
    bidId: string;
    allocatedQuantity: number;
    price: number;
  }>;
  matchedSupplies: Array<{
    supplyId: string;
    allocatedQuantity: number;
    reservePrice: number;
  }>;
  unmetDemand: number;
  unmetSupply: number;
}

export class ClearingPriceService {
  
  /**
   * Calculate clearing price using merit order algorithm
   * This implements a standard electricity market clearing mechanism
   */
  async calculateClearingPrice(timeslotId: string): Promise<ClearingResult> {
    try {
      logger.info('Starting clearing price calculation', { timeslotId });

      // 1. Fetch all active bids and supplies for the timeslot
      const [bids, supplies] = await Promise.all([
        this.getActiveBids(timeslotId),
        this.getActiveSupplies(timeslotId)
      ]);

      if (bids.length === 0 || supplies.length === 0) {
        logger.warn('No bids or supplies found for clearing', {
          timeslotId,
          bidCount: bids.length,
          supplyCount: supplies.length
        });
        
        return {
          clearingPrice: 0,
          totalVolume: 0,
          matchedBids: [],
          matchedSupplies: [],
          unmetDemand: bids.reduce((sum, bid) => sum + bid.quantity, 0),
          unmetSupply: supplies.reduce((sum, supply) => sum + supply.quantity, 0)
        };
      }

      // 2. Sort bids by price (descending - highest willingness to pay first)
      const sortedBids = [...bids].sort((a, b) => b.price - a.price);
      
      // 3. Sort supplies by reserve price (ascending - lowest cost first)
      const sortedSupplies = [...supplies].sort((a, b) => a.reservePrice - b.reservePrice);

      // 4. Build demand and supply curves
      const demandCurve = this.buildDemandCurve(sortedBids);
      const supplyCurve = this.buildSupplyCurve(sortedSupplies);

      // 5. Find intersection point (clearing price and quantity)
      let intersection;
      try {
        intersection = this.findIntersection(demandCurve, supplyCurve);
      } catch (error) {
        logger.warn('No market intersection found', { 
          timeslotId, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
        return {
          clearingPrice: 0,
          totalVolume: 0,
          matchedBids: [],
          matchedSupplies: [],
          unmetDemand: bids.reduce((sum, bid) => sum + bid.quantity, 0),
          unmetSupply: supplies.reduce((sum, supply) => sum + supply.quantity, 0)
        };
      }

      // 6. Allocate quantities at clearing price
      const allocation = this.allocateAtClearingPrice(
        sortedBids,
        sortedSupplies,
        intersection.price,
        intersection.quantity
      );

      logger.info('Clearing price calculation completed', {
        timeslotId,
        clearingPrice: intersection.price,
        totalVolume: intersection.quantity,
        matchedBids: allocation.matchedBids.length,
        matchedSupplies: allocation.matchedSupplies.length
      });

      return {
        clearingPrice: intersection.price,
        totalVolume: intersection.quantity,
        matchedBids: allocation.matchedBids,
        matchedSupplies: allocation.matchedSupplies,
        unmetDemand: allocation.unmetDemand,
        unmetSupply: allocation.unmetSupply
      };

    } catch (error) {
      logger.error('Failed to calculate clearing price', {
        error: error instanceof Error ? error.message : 'Unknown error',
        timeslotId
      });
      throw error;
    }
  }

  /**
   * Get active bids for timeslot
   */
  private async getActiveBids(timeslotId: string): Promise<BidData[]> {
    const bids = await prismaService.client.bid.findMany({
      where: {
        timeslotId,
        status: 'PENDING'
      },
      select: {
        id: true,
        price: true,
        quantity: true,
        userId: true
      }
    });

    return bids.map(bid => ({
      id: bid.id,
      price: Number(bid.price),
      quantity: Number(bid.quantity),
      userId: bid.userId
    }));
  }

  /**
   * Get active supplies for timeslot
   */
  private async getActiveSupplies(timeslotId: string): Promise<SupplyData[]> {
    const supplies = await prismaService.client.supply.findMany({
      where: {
        timeslotId,
        status: 'COMMITTED'
      },
      select: {
        id: true,
        reservePrice: true,
        quantity: true,
        userId: true
      }
    });

    return supplies.map(supply => ({
      id: supply.id,
      reservePrice: Number(supply.reservePrice),
      quantity: Number(supply.quantity),
      userId: supply.userId
    }));
  }

  /**
   * Build demand curve from sorted bids
   */
  private buildDemandCurve(sortedBids: BidData[]): Array<{ price: number; cumulativeQuantity: number }> {
    const curve: Array<{ price: number; cumulativeQuantity: number }> = [];
    let cumulativeQuantity = 0;

    for (const bid of sortedBids) {
      cumulativeQuantity += bid.quantity;
      curve.push({
        price: bid.price,
        cumulativeQuantity
      });
    }

    return curve;
  }

  /**
   * Build supply curve from sorted supplies
   */
  private buildSupplyCurve(sortedSupplies: SupplyData[]): Array<{ price: number; cumulativeQuantity: number }> {
    const curve: Array<{ price: number; cumulativeQuantity: number }> = [];
    let cumulativeQuantity = 0;

    for (const supply of sortedSupplies) {
      cumulativeQuantity += supply.quantity;
      curve.push({
        price: supply.reservePrice,
        cumulativeQuantity
      });
    }

    return curve;
  }

  /**
   * Find intersection of demand and supply curves
   */
  private findIntersection(
    demandCurve: Array<{ price: number; cumulativeQuantity: number }>,
    supplyCurve: Array<{ price: number; cumulativeQuantity: number }>
  ): { price: number; quantity: number } {
    
    for (let i = 0; i < demandCurve.length; i++) {
      const demandPoint = demandCurve[i];
      
      // Find corresponding supply point at this quantity level
      const supplyPoint = supplyCurve.find(s => s.cumulativeQuantity >= demandPoint.cumulativeQuantity);
      
      if (supplyPoint && demandPoint.price >= supplyPoint.price) {
        // Market clears at this point
        return {
          price: supplyPoint.price, // Use supply price as clearing price
          quantity: Math.min(demandPoint.cumulativeQuantity, supplyPoint.cumulativeQuantity)
        };
      }
    }

    // No intersection found - market cannot clear
    throw new Error('No market intersection found - demand and supply curves do not intersect');
  }

  /**
   * Allocate quantities at clearing price
   */
  private allocateAtClearingPrice(
    sortedBids: BidData[],
    sortedSupplies: SupplyData[],
    clearingPrice: number,
    clearingQuantity: number
  ) {
    const matchedBids: Array<{ bidId: string; allocatedQuantity: number; price: number }> = [];
    const matchedSupplies: Array<{ supplyId: string; allocatedQuantity: number; reservePrice: number }> = [];
    
    let remainingQuantity = clearingQuantity;
    let unmetDemand = 0;
    let unmetSupply = 0;

    // Allocate to bids (highest price first)
    for (const bid of sortedBids) {
      if (remainingQuantity <= 0) {
        unmetDemand += bid.quantity;
        continue;
      }

      if (bid.price >= clearingPrice) {
        const allocatedQuantity = Math.min(bid.quantity, remainingQuantity);
        matchedBids.push({
          bidId: bid.id,
          allocatedQuantity,
          price: bid.price
        });
        remainingQuantity -= allocatedQuantity;
        
        if (allocatedQuantity < bid.quantity) {
          unmetDemand += (bid.quantity - allocatedQuantity);
        }
      } else {
        unmetDemand += bid.quantity;
      }
    }

    // Reset for supply allocation
    remainingQuantity = clearingQuantity;

    // Allocate to supplies (lowest reserve price first)
    for (const supply of sortedSupplies) {
      if (remainingQuantity <= 0) {
        unmetSupply += supply.quantity;
        continue;
      }

      if (supply.reservePrice <= clearingPrice) {
        const allocatedQuantity = Math.min(supply.quantity, remainingQuantity);
        matchedSupplies.push({
          supplyId: supply.id,
          allocatedQuantity,
          reservePrice: supply.reservePrice
        });
        remainingQuantity -= allocatedQuantity;
        
        if (allocatedQuantity < supply.quantity) {
          unmetSupply += (supply.quantity - allocatedQuantity);
        }
      } else {
        unmetSupply += supply.quantity;
      }
    }

    return {
      matchedBids,
      matchedSupplies,
      unmetDemand,
      unmetSupply
    };
  }

  /**
   * Execute market clearing for a timeslot
   */
  async executeMarketClearing(timeslotId: string): Promise<ClearingResult> {
    try {
      const result = await this.calculateClearingPrice(timeslotId);
      
      if (result.totalVolume > 0) {
        // Update bid statuses
        for (const matchedBid of result.matchedBids) {
          await prismaService.client.bid.update({
            where: { id: matchedBid.bidId },
            data: { status: 'MATCHED' }
          });
        }

        // Update supply statuses
        for (const matchedSupply of result.matchedSupplies) {
          await prismaService.client.supply.update({
            where: { id: matchedSupply.supplyId },
            data: { status: 'ALLOCATED' }
          });
        }

        logger.info('Market clearing executed successfully', {
          timeslotId,
          clearingPrice: result.clearingPrice,
          totalVolume: result.totalVolume
        });
      }

      return result;
    } catch (error) {
      logger.error('Failed to execute market clearing', {
        error: error instanceof Error ? error.message : 'Unknown error',
        timeslotId
      });
      throw error;
    }
  }
}

export const clearingPriceService = new ClearingPriceService();
