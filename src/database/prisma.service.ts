import { PrismaClient, Prisma } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { prisma } from '@/config/database';
import { logger } from '@/utils/logger';
import { AppError } from '@/utils/errors';

export class PrismaService {
  public client: PrismaClient;
  private maxRetries = 3;
  private retryDelay = 1000; // 1 second

  constructor() {
    this.client = prisma;
  }

  async connect(): Promise<void> {
    try {
      await this.client.$connect();
      logger.info('Database connected successfully');
    } catch (error) {
      logger.error('Failed to connect to database:', error);
      throw new AppError('Database connection failed', 500);
    }
  }

  async disconnect(): Promise<void> {
    try {
      await this.client.$disconnect();
      logger.info('Database disconnected successfully');
    } catch (error) {
      logger.error('Failed to disconnect from database:', error);
    }
  }

  async healthCheck(): Promise<{ status: string; latency: number }> {
    const start = Date.now();
    try {
      await this.client.$queryRaw`SELECT 1`;
      const latency = Date.now() - start;
      return { status: 'healthy', latency };
    } catch (error) {
      logger.error('Database health check failed:', error);
      throw new AppError('Database health check failed', 500);
    }
  }

  private async executeWithRetry<T>(operation: () => Promise<T>, maxRetries = 3): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === maxRetries) {
          logger.error(`Database operation failed after ${maxRetries} attempts:`, error);
          throw error;
        }
        
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        logger.warn(`Database operation failed (attempt ${attempt}/${maxRetries}), retrying in ${delay}ms:`, error);
        await this.delay(delay);
      }
    }
    
    throw lastError!;
  }

  async transaction<T>(
    operations: (tx: Prisma.TransactionClient) => Promise<T>
  ): Promise<T> {
    return this.executeWithRetry(async () => {
      return this.client.$transaction(operations, {
        maxWait: 5000, // 5 seconds
        timeout: 10000, // 10 seconds
      });
    });
  }

  private isRetryableError(error: any): boolean {
    // Check for connection errors, timeouts, etc.
    if (error.code && typeof error.code === 'string') {
      // Connection errors
      return ['P1001', 'P1002', 'P1008', 'P1017'].includes(error.code);
    }
    
    // Check for network/connection related errors
    if (error.message && error.message.includes('connection')) {
      return true;
    }

    return false;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // User operations
  async findUserByWallet(walletAddress: string) {
    try {
      const user = await this.client.user.findUnique({
        where: { walletAddress }
      });
      
      if (user) {
        logger.debug('User found by wallet', { 
          userId: user.id,
          walletAddress: walletAddress.substring(0, 8) + '...'
        });
      }
      
      return user;
    } catch (error) {
      logger.error('Failed to find user by wallet:', error);
      throw error;
    }
  }

  async createUser(walletAddress: string) {
    return this.executeWithRetry(() =>
      this.client.user.create({
        data: {
          walletAddress,
          lastLoginAt: new Date()
        }
      })
    );
  }

  async updateUserLastLogin(userId: string) {
    return this.executeWithRetry(() =>
      this.client.user.update({
        where: { id: userId },
        data: { lastLoginAt: new Date() }
      })
    );
  }

  // Auth nonce operations
  async createAuthNonce(walletAddress: string, nonce: string, expiresAt: Date) {
    return this.executeWithRetry(() =>
      this.client.authNonce.create({
        data: {
          walletAddress,
          nonce,
          expiresAt
        }
      })
    );
  }

  async findValidNonce(nonce: string) {
    return this.executeWithRetry(() =>
      this.client.authNonce.findFirst({
        where: {
          nonce,
          expiresAt: { gt: new Date() },
          usedAt: null
        }
      })
    );
  }

  async markNonceAsUsed(nonceId: string) {
    return this.executeWithRetry(() =>
      this.client.authNonce.update({
        where: { id: nonceId },
        data: { usedAt: new Date() }
      })
    );
  }

  async cleanupExpiredNonces() {
    return this.executeWithRetry(() =>
      this.client.authNonce.deleteMany({
        where: {
          expiresAt: { lt: new Date() }
        }
      })
    );
  }

  // Timeslot operations
  async createTimeslot(data: {
    startTime: Date;
    endTime: Date;
    totalEnergy: number;
    clearingPrice?: number;
    status?: 'OPEN' | 'SEALED' | 'SETTLED';
  }) {
    return this.executeWithRetry(() =>
      this.client.timeslot.create({
        data: {
          startTime: data.startTime,
          endTime: data.endTime,
          totalEnergy: data.totalEnergy,
          clearingPrice: data.clearingPrice || null,
          status: data.status || 'OPEN'
        }
      })
    );
  }

  async findTimeslotById(id: string) {
    return this.executeWithRetry(() =>
      this.client.timeslot.findUnique({
        where: { id }
      })
    );
  }

  async findTimeslotByTimeRange(startTime: Date, endTime: Date) {
    return this.executeWithRetry(() =>
      this.client.timeslot.findFirst({
        where: {
          startTime: { gte: startTime },
          endTime: { lte: endTime }
        }
      })
    );
  }

  async findTimeslots(options: {
    filters: any;
    pagination: {
      offset: number;
      limit: number;
      sortBy: string;
      sortOrder: string;
    };
  }) {
    const { filters, pagination } = options;
    
    // Build where clause
    const where: any = {};
    
    if (filters.status) {
      where.status = filters.status;
    }
    
    if (filters.startTimeFrom) {
      where.startTime = { ...where.startTime, gte: filters.startTimeFrom };
    }
    
    if (filters.startTimeTo) {
      where.startTime = { ...where.startTime, lte: filters.startTimeTo };
    }
    
    if (filters.minReservePrice) {
      where.reservePrice = { ...where.reservePrice, gte: filters.minReservePrice };
    }
    
    if (filters.maxReservePrice) {
      where.reservePrice = { ...where.reservePrice, lte: filters.maxReservePrice };
    }

    // Build orderBy clause
    const orderBy: any = {};
    orderBy[pagination.sortBy] = pagination.sortOrder;

    return this.executeWithRetry(async () => {
      const [timeslots, total] = await Promise.all([
        this.client.timeslot.findMany({
          where,
          orderBy,
          skip: pagination.offset,
          take: pagination.limit
        }),
        this.client.timeslot.count({ where })
      ]);

      return { timeslots, total };
    });
  }

  async updateTimeslot(id: string, updates: any) {
    return this.executeWithRetry(() =>
      this.client.timeslot.update({
        where: { id },
        data: updates
      })
    );
  }

  async updateTimeslotStatus(id: string, status: 'OPEN' | 'SEALED' | 'SETTLED') {
    return this.executeWithRetry(() =>
      this.client.timeslot.update({
        where: { id },
        data: { status }
      })
    );
  }

  async settleTimeslot(id: string, clearingPrice: number) {
    return this.executeWithRetry(() =>
      this.client.timeslot.update({
        where: { id },
        data: {
          status: 'SETTLED',
          clearingPrice
        }
      })
    );
  }

  // Bid operations
  async findBidsByTimeslot(timeslotId: string) {
    return this.executeWithRetry(() =>
      this.client.bid.findMany({
        where: { timeslotId }
      })
    );
  }

  // Supply operations
  async findSuppliesByTimeslot(timeslotId: string) {
    return this.executeWithRetry(() =>
      this.client.supply.findMany({
        where: { timeslotId }
      })
    );
  }
}

export const prismaService = new PrismaService();
