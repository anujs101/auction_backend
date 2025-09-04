import { logger } from './logger';
import { env } from '@/config/environment';

/**
 * Secure logging utility that prevents information leakage in production
 */
export class SecureLogger {
  /**
   * Log error with production-safe formatting
   */
  static logError(message: string, error: any, context?: Record<string, any>) {
    const errorId = `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const logData: any = {
      errorId,
      message,
      timestamp: new Date().toISOString(),
      ...context
    };

    if (env.NODE_ENV === 'development') {
      // Full error details in development
      logData.error = {
        message: error.message,
        stack: error.stack,
        name: error.name
      };
    } else {
      // Minimal error info in production
      logData.error = {
        type: error.constructor.name,
        message: error.message
      };
    }

    logger.error(message, logData);
    return errorId;
  }

  /**
   * Log authentication events with wallet address masking
   */
  static logAuth(event: string, walletAddress: string, context?: Record<string, any>) {
    const maskedWallet = this.maskWalletAddress(walletAddress);
    
    logger.info(`Auth: ${event}`, {
      walletAddress: maskedWallet,
      timestamp: new Date().toISOString(),
      ...context
    });
  }

  /**
   * Log business operations with sensitive data masking
   */
  static logOperation(operation: string, userId: string, context?: Record<string, any>) {
    const sanitizedContext = this.sanitizeContext(context);
    
    logger.info(`Operation: ${operation}`, {
      userId: userId.substring(0, 8) + '...',
      timestamp: new Date().toISOString(),
      ...sanitizedContext
    });
  }

  /**
   * Mask wallet address for logging
   */
  private static maskWalletAddress(address: string): string {
    if (address.length <= 8) return address;
    return `${address.substring(0, 4)}...${address.substring(address.length - 4)}`;
  }

  /**
   * Sanitize context object to remove sensitive data
   */
  private static sanitizeContext(context?: Record<string, any>): Record<string, any> {
    if (!context) return {};

    const sanitized = { ...context };
    const sensitiveKeys = ['password', 'token', 'secret', 'key', 'signature', 'privateKey'];
    
    for (const key of Object.keys(sanitized)) {
      if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
        sanitized[key] = '[REDACTED]';
      }
    }

    return sanitized;
  }
}
