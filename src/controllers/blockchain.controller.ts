import { Request, Response } from 'express';
import { z } from 'zod';
import { blockchainService } from '@/services/blockchain.service';
import { BlockchainDataConverter, BlockchainValidator, TimeUtils } from '@/utils/blockchain.utils';
import { logger } from '@/utils/logger';
import { ValidationError, BlockchainError, NotFoundError } from '@/utils/errors';
import { AuthenticatedRequest } from '@/types/wallet-auth.types';

// Validation schemas
const timeslotEpochSchema = z.object({
  epoch: z.number().int().positive()
});

const walletAddressSchema = z.object({
  walletAddress: z.string().min(32).max(44)
});

const bidParamsSchema = z.object({
  timeslotEpoch: z.number().int().positive(),
  price: z.number().positive().max(1000),
  quantity: z.number().positive().max(1000000)
});

const supplyParamsSchema = z.object({
  timeslotEpoch: z.number().int().positive(),
  reservePrice: z.number().min(0).max(1000),
  quantity: z.number().positive().max(1000000)
});

export class BlockchainController {
  /**
   * Get blockchain connection health
   */
  async getHealth(req: Request, res: Response): Promise<void> {
    try {
      const health = await blockchainService.checkConnection();
      
      res.json({
        success: true,
        data: health
      });
    } catch (error) {
      logger.error('Blockchain health check failed:', error);
      res.status(503).json({
        success: false,
        error: 'Blockchain service unavailable'
      });
    }
  }

  /**
   * Get global auction state
   */
  async getGlobalState(req: Request, res: Response): Promise<void> {
    try {
      const globalState = await blockchainService.getGlobalState();
      
      if (!globalState) {
        throw new NotFoundError('Global state not found');
      }

      const convertedState = BlockchainDataConverter.convertGlobalState(globalState);
      
      res.json({
        success: true,
        data: convertedState
      });
    } catch (error) {
      logger.error('Failed to get global state:', error);
      
      if (error instanceof NotFoundError) {
        res.status(404).json({
          success: false,
          error: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Failed to fetch global state'
        });
      }
    }
  }

  /**
   * Get specific timeslot by epoch
   */
  async getTimeslot(req: Request, res: Response): Promise<void> {
    try {
      const { epoch } = timeslotEpochSchema.parse({
        epoch: parseInt(req.params.epoch)
      });

      const timeslot = await blockchainService.getTimeslot(epoch);
      
      if (!timeslot) {
        throw new NotFoundError(`Timeslot ${epoch} not found`);
      }

      const convertedTimeslot = BlockchainDataConverter.convertTimeslot(timeslot);
      
      res.json({
        success: true,
        data: convertedTimeslot
      });
    } catch (error) {
      logger.error('Failed to get timeslot:', error);
      
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: 'Invalid timeslot epoch',
          details: error.errors
        });
      } else if (error instanceof NotFoundError) {
        res.status(404).json({
          success: false,
          error: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Failed to fetch timeslot'
        });
      }
    }
  }

  /**
   * Get all active timeslots
   */
  async getActiveTimeslots(req: Request, res: Response): Promise<void> {
    try {
      const activeTimeslots = await blockchainService.getActiveTimeslots();
      
      const convertedTimeslots = activeTimeslots.map(({ publicKey, account }) => ({
        publicKey: publicKey.toString(),
        data: BlockchainDataConverter.convertTimeslot(account)
      }));
      
      res.json({
        success: true,
        data: convertedTimeslots,
        count: convertedTimeslots.length
      });
    } catch (error) {
      logger.error('Failed to get active timeslots:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch active timeslots'
      });
    }
  }

  /**
   * Get bids for a specific timeslot
   */
  async getTimeslotBids(req: Request, res: Response): Promise<void> {
    try {
      const { epoch } = timeslotEpochSchema.parse({
        epoch: parseInt(req.params.epoch)
      });

      const bids = await blockchainService.getBidsForTimeslot(epoch);
      
      const convertedBids = bids.map(({ publicKey, account }) => ({
        publicKey: publicKey.toString(),
        data: BlockchainDataConverter.convertBid(publicKey, account)
      }));
      
      res.json({
        success: true,
        data: convertedBids,
        count: convertedBids.length
      });
    } catch (error) {
      logger.error('Failed to get timeslot bids:', error);
      
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: 'Invalid timeslot epoch',
          details: error.errors
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Failed to fetch timeslot bids'
        });
      }
    }
  }

  /**
   * Get supplies for a specific timeslot
   */
  async getTimeslotSupplies(req: Request, res: Response): Promise<void> {
    try {
      const { epoch } = timeslotEpochSchema.parse({
        epoch: parseInt(req.params.epoch)
      });

      const supplies = await blockchainService.getSuppliesForTimeslot(epoch);
      
      const convertedSupplies = supplies.map(({ publicKey, account }) => ({
        publicKey: publicKey.toString(),
        data: BlockchainDataConverter.convertSupply(publicKey, account)
      }));
      
      res.json({
        success: true,
        data: convertedSupplies,
        count: convertedSupplies.length
      });
    } catch (error) {
      logger.error('Failed to get timeslot supplies:', error);
      
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: 'Invalid timeslot epoch',
          details: error.errors
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Failed to fetch timeslot supplies'
        });
      }
    }
  }

  /**
   * Get user's bids (requires authentication)
   */
  async getUserBids(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userWallet = req.user!.walletAddress;
      
      const bids = await blockchainService.getUserBids(userWallet);
      
      const convertedBids = bids.map(({ publicKey, account }) => ({
        publicKey: publicKey.toString(),
        data: BlockchainDataConverter.convertBid(publicKey, account)
      }));
      
      res.json({
        success: true,
        data: convertedBids,
        count: convertedBids.length
      });
    } catch (error) {
      logger.error('Failed to get user bids:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch user bids'
      });
    }
  }

  /**
   * Get user's supplies (requires authentication)
   */
  async getUserSupplies(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userWallet = req.user!.walletAddress;
      
      const supplies = await blockchainService.getUserSupplies(userWallet);
      
      const convertedSupplies = supplies.map(({ publicKey, account }) => ({
        publicKey: publicKey.toString(),
        data: BlockchainDataConverter.convertSupply(publicKey, account)
      }));
      
      res.json({
        success: true,
        data: convertedSupplies,
        count: convertedSupplies.length
      });
    } catch (error) {
      logger.error('Failed to get user supplies:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch user supplies'
      });
    }
  }

  /**
   * Get account balance for a wallet
   */
  async getAccountBalance(req: Request, res: Response): Promise<void> {
    try {
      const { walletAddress } = walletAddressSchema.parse(req.params);
      
      if (!BlockchainValidator.isValidPublicKey(walletAddress)) {
        throw new ValidationError('Invalid wallet address format');
      }

      const balance = await blockchainService.getAccountBalance(walletAddress);
      
      res.json({
        success: true,
        data: {
          walletAddress,
          balance,
          balanceFormatted: `${balance.toFixed(4)} SOL`
        }
      });
    } catch (error) {
      logger.error('Failed to get account balance:', error);
      
      if (error instanceof z.ZodError || error instanceof ValidationError) {
        res.status(400).json({
          success: false,
          error: 'Invalid wallet address',
          details: error instanceof z.ZodError ? error.errors : undefined
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Failed to fetch account balance'
        });
      }
    }
  }

  /**
   * Validate bid parameters (utility endpoint)
   */
  async validateBidParams(req: Request, res: Response): Promise<void> {
    try {
      const params = bidParamsSchema.parse(req.body);
      
      const validation = BlockchainValidator.validateBidParams(params);
      
      res.json({
        success: true,
        data: {
          valid: validation.valid,
          errors: validation.errors,
          params
        }
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: 'Invalid bid parameters',
          details: error.errors
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Failed to validate bid parameters'
        });
      }
    }
  }

  /**
   * Validate supply parameters (utility endpoint)
   */
  async validateSupplyParams(req: Request, res: Response): Promise<void> {
    try {
      const params = supplyParamsSchema.parse(req.body);
      
      const validation = BlockchainValidator.validateSupplyParams(params);
      
      res.json({
        success: true,
        data: {
          valid: validation.valid,
          errors: validation.errors,
          params
        }
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: 'Invalid supply parameters',
          details: error.errors
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Failed to validate supply parameters'
        });
      }
    }
  }

  /**
   * Get PDA addresses for debugging/development
   */
  async getPDAAddresses(req: Request, res: Response): Promise<void> {
    try {
      const { epoch, walletAddress } = req.query;
      
      if (!epoch || !walletAddress) {
        throw new ValidationError('Both epoch and walletAddress are required');
      }

      const epochNum = parseInt(epoch as string);
      if (isNaN(epochNum)) {
        throw new ValidationError('Invalid epoch number');
      }

      if (!BlockchainValidator.isValidPublicKey(walletAddress as string)) {
        throw new ValidationError('Invalid wallet address');
      }

      const [timeslotPDA, timeslotBump] = blockchainService.getTimeslotPDA(epochNum);
      const [bidPDA, bidBump] = blockchainService.getBidPDA(
        new (await import('@solana/web3.js')).PublicKey(walletAddress as string),
        epochNum
      );
      const [supplyPDA, supplyBump] = blockchainService.getSupplyPDA(
        new (await import('@solana/web3.js')).PublicKey(walletAddress as string),
        epochNum
      );
      const [globalStatePDA, globalStateBump] = blockchainService.getGlobalStatePDA();

      res.json({
        success: true,
        data: {
          timeslot: {
            address: timeslotPDA.toString(),
            bump: timeslotBump
          },
          bid: {
            address: bidPDA.toString(),
            bump: bidBump
          },
          supply: {
            address: supplyPDA.toString(),
            bump: supplyBump
          },
          globalState: {
            address: globalStatePDA.toString(),
            bump: globalStateBump
          }
        }
      });
    } catch (error) {
      logger.error('Failed to get PDA addresses:', error);
      
      if (error instanceof ValidationError) {
        res.status(400).json({
          success: false,
          error: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Failed to calculate PDA addresses'
        });
      }
    }
  }

  /**
   * Get current time utilities
   */
  async getTimeInfo(req: Request, res: Response): Promise<void> {
    try {
      const currentTimestamp = TimeUtils.getCurrentTimestamp();
      const nextTimeslotEpoch = TimeUtils.getNextTimeslotEpoch();
      const currentTimeslotEpoch = TimeUtils.calculateTimeslotEpoch(currentTimestamp);

      res.json({
        success: true,
        data: {
          currentTimestamp,
          currentTimeslotEpoch,
          nextTimeslotEpoch,
          currentTime: new Date().toISOString(),
          nextTimeslotTime: new Date(nextTimeslotEpoch * 1000).toISOString()
        }
      });
    } catch (error) {
      logger.error('Failed to get time info:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get time information'
      });
    }
  }
}

export const blockchainController = new BlockchainController();
