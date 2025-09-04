import { Request, Response, NextFunction } from 'express';
import { AppError } from '@/utils/errors';
import { logger } from '@/utils/logger';
import { env } from '@/config/environment';

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let err = error;

  // Generate unique error ID for tracking
  const errorId = `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Log error with ID for internal tracking
  logger.error('Error occurred:', {
    errorId,
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });

  // Convert non-AppError instances to AppError
  if (!(err instanceof AppError)) {
    const statusCode = 500;
    const message = env.NODE_ENV === 'development' ? err.message : 'Internal server error';
    err = new AppError(message, statusCode, false);
  }

  const appError = err as AppError;

  // Production-safe error response
  const errorResponse: any = {
    success: false,
    error: {
      message: appError.message,
      errorId: env.NODE_ENV === 'production' ? errorId : undefined
    }
  };

  // Only include stack trace in development
  if (env.NODE_ENV === 'development') {
    errorResponse.error.stack = appError.stack;
  }

  res.status(appError.statusCode).json(errorResponse);
};

export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    error: {
      message: `Route ${req.originalUrl} not found`
    }
  });
};

export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
