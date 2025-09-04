import { socketService } from './socket.service';
import { logger } from '@/utils/logger';
import { 
  BidUpdateMessage,
  SupplyUpdateMessage,
  TimeslotUpdateMessage,
  UserNotificationMessage,
  WalletBalanceUpdateMessage
} from '@/types/websocket.types';

export class EventsService {
  
  /**
   * Emit bid placed event
   */
  static emitBidPlaced(bidData: {
    bidId: string;
    timeslotId: string;
    userId: string;
    price: number;
    quantity: number;
    status: string;
  }): void {
    const message: BidUpdateMessage = {
      type: 'BID_PLACED',
      data: bidData,
      timestamp: new Date(),
      userId: bidData.userId
    };

    socketService.broadcastBidUpdate(message);
    
    // Send notification to user
    this.sendUserNotification(bidData.userId, {
      title: 'Bid Placed Successfully',
      message: `Your bid for ${bidData.quantity} kWh at $${bidData.price} has been placed.`,
      level: 'success'
    });
  }

  /**
   * Emit bid cancelled event
   */
  static emitBidCancelled(bidData: {
    bidId: string;
    timeslotId: string;
    userId: string;
    price: number;
    quantity: number;
    status: string;
  }): void {
    const message: BidUpdateMessage = {
      type: 'BID_CANCELLED',
      data: bidData,
      timestamp: new Date(),
      userId: bidData.userId
    };

    socketService.broadcastBidUpdate(message);
    
    // Send notification to user
    this.sendUserNotification(bidData.userId, {
      title: 'Bid Cancelled',
      message: `Your bid for ${bidData.quantity} kWh has been cancelled.`,
      level: 'info'
    });
  }

  /**
   * Emit bid matched event
   */
  static emitBidMatched(bidData: {
    bidId: string;
    timeslotId: string;
    userId: string;
    price: number;
    quantity: number;
    status: string;
  }): void {
    const message: BidUpdateMessage = {
      type: 'BID_MATCHED',
      data: bidData,
      timestamp: new Date(),
      userId: bidData.userId
    };

    socketService.broadcastBidUpdate(message);
    
    // Send notification to user
    this.sendUserNotification(bidData.userId, {
      title: 'Bid Matched!',
      message: `Your bid for ${bidData.quantity} kWh at $${bidData.price} has been matched.`,
      level: 'success'
    });
  }

  /**
   * Emit supply committed event
   */
  static emitSupplyCommitted(supplyData: {
    supplyId: string;
    timeslotId: string;
    userId: string;
    quantity: number;
    reservePrice: number;
    status: string;
  }): void {
    const message: SupplyUpdateMessage = {
      type: 'SUPPLY_COMMITTED',
      data: supplyData,
      timestamp: new Date(),
      userId: supplyData.userId
    };

    socketService.broadcastSupplyUpdate(message);
    
    // Send notification to user
    this.sendUserNotification(supplyData.userId, {
      title: 'Supply Committed',
      message: `Your supply of ${supplyData.quantity} kWh at reserve price $${supplyData.reservePrice} has been committed.`,
      level: 'success'
    });
  }

  /**
   * Emit supply cancelled event
   */
  static emitSupplyCancelled(supplyData: {
    supplyId: string;
    timeslotId: string;
    userId: string;
    quantity: number;
    reservePrice: number;
    status: string;
  }): void {
    const message: SupplyUpdateMessage = {
      type: 'SUPPLY_CANCELLED',
      data: supplyData,
      timestamp: new Date(),
      userId: supplyData.userId
    };

    socketService.broadcastSupplyUpdate(message);
    
    // Send notification to user
    this.sendUserNotification(supplyData.userId, {
      title: 'Supply Cancelled',
      message: `Your supply of ${supplyData.quantity} kWh has been cancelled.`,
      level: 'info'
    });
  }

  /**
   * Emit supply allocated event
   */
  static emitSupplyAllocated(supplyData: {
    supplyId: string;
    timeslotId: string;
    userId: string;
    quantity: number;
    reservePrice: number;
    status: string;
  }): void {
    const message: SupplyUpdateMessage = {
      type: 'SUPPLY_ALLOCATED',
      data: supplyData,
      timestamp: new Date(),
      userId: supplyData.userId
    };

    socketService.broadcastSupplyUpdate(message);
    
    // Send notification to user
    this.sendUserNotification(supplyData.userId, {
      title: 'Supply Allocated!',
      message: `Your supply of ${supplyData.quantity} kWh has been allocated at $${supplyData.reservePrice}.`,
      level: 'success'
    });
  }

  /**
   * Emit timeslot sealed event
   */
  static emitTimeslotSealed(timeslotData: {
    timeslotId: string;
    status: string;
    totalEnergy?: number;
  }): void {
    const message: TimeslotUpdateMessage = {
      type: 'TIMESLOT_SEALED',
      data: timeslotData,
      timestamp: new Date()
    };

    socketService.broadcastTimeslotUpdate(message);
    
    logger.info('Timeslot sealed event emitted', {
      timeslotId: timeslotData.timeslotId,
      totalEnergy: timeslotData.totalEnergy
    });
  }

  /**
   * Emit timeslot settled event
   */
  static emitTimeslotSettled(timeslotData: {
    timeslotId: string;
    status: string;
    clearingPrice?: number;
    totalEnergy?: number;
  }): void {
    const message: TimeslotUpdateMessage = {
      type: 'TIMESLOT_SETTLED',
      data: timeslotData,
      timestamp: new Date()
    };

    socketService.broadcastTimeslotUpdate(message);
    
    logger.info('Timeslot settled event emitted', {
      timeslotId: timeslotData.timeslotId,
      clearingPrice: timeslotData.clearingPrice,
      totalEnergy: timeslotData.totalEnergy
    });
  }

  /**
   * Emit clearing price update event
   */
  static emitClearingPriceUpdate(timeslotData: {
    timeslotId: string;
    clearingPrice: number;
    totalEnergy?: number;
  }): void {
    const message: TimeslotUpdateMessage = {
      type: 'CLEARING_PRICE_UPDATE',
      data: timeslotData,
      timestamp: new Date()
    };

    socketService.broadcastTimeslotUpdate(message);
    
    logger.info('Clearing price update emitted', {
      timeslotId: timeslotData.timeslotId,
      clearingPrice: timeslotData.clearingPrice
    });
  }

  /**
   * Send wallet balance update
   */
  static emitWalletBalanceUpdate(walletAddress: string, balance: number, currency: string = 'SOL'): void {
    const message: WalletBalanceUpdateMessage = {
      type: 'WALLET_BALANCE_UPDATE',
      data: {
        walletAddress,
        balance,
        currency
      },
      timestamp: new Date(),
      walletAddress
    };

    socketService.sendWalletNotification(walletAddress, {
      type: 'USER_NOTIFICATION',
      data: {
        title: 'Wallet Balance Updated',
        message: `Your ${currency} balance has been updated to ${balance}`,
        level: 'info'
      },
      timestamp: new Date(),
      walletAddress
    });

    logger.info('Wallet balance update emitted', {
      walletAddress: walletAddress.substring(0, 8) + '...',
      balance,
      currency
    });
  }

  /**
   * Send user notification by user ID
   */
  private static async sendUserNotification(userId: string, notification: {
    title: string;
    message: string;
    level: 'info' | 'warning' | 'error' | 'success';
    actionUrl?: string;
  }): Promise<void> {
    try {
      // Find wallet address for user ID - this would typically involve a database lookup
      // For now, we'll use the socket service's internal mapping
      const stats = socketService.getConnectionStats();
      
      // In a real implementation, you'd query the database for the user's wallet address
      // For now, we'll emit to all authenticated users and let the client filter
      const message: UserNotificationMessage = {
        type: 'USER_NOTIFICATION',
        data: notification,
        timestamp: new Date(),
        userId
      };

      // This is a simplified approach - in production you'd want to:
      // 1. Query database for user's wallet address
      // 2. Send directly to that wallet's room
      logger.info('User notification prepared', {
        userId,
        title: notification.title,
        level: notification.level
      });

    } catch (error) {
      logger.error('Failed to send user notification', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Send system-wide announcement
   */
  static emitSystemAnnouncement(announcement: {
    title: string;
    message: string;
    level: 'info' | 'warning' | 'error' | 'success';
    actionUrl?: string;
  }): void {
    const message: UserNotificationMessage = {
      type: 'USER_NOTIFICATION',
      data: announcement,
      timestamp: new Date()
    };

    // Broadcast to all authenticated users
    socketService.getServer().to('authenticated').emit('system_announcement', message);
    
    logger.info('System announcement emitted', {
      title: announcement.title,
      level: announcement.level
    });
  }

  /**
   * Send auction status update
   */
  static emitAuctionStatusUpdate(status: {
    isActive: boolean;
    currentTimeslot?: string;
    nextTimeslot?: string;
    totalParticipants?: number;
  }): void {
    socketService.getServer().to('authenticated').emit('auction_status', {
      type: 'AUCTION_STATUS_UPDATE',
      data: status,
      timestamp: new Date()
    });

    logger.info('Auction status update emitted', {
      isActive: status.isActive,
      currentTimeslot: status.currentTimeslot
    });
  }
}

export const eventsService = EventsService;
