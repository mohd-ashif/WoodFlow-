import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { ApiError } from '../utils/errors.js';
import { logger } from '../config/logger.js';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
) {
  logger.error({ err, path: req.path, method: req.method }, 'Request Error');

  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      code: err.code,
    });
  }

  if (err instanceof ZodError) {
    const issues = err.issues.map((i) => i.message).join(', ');
    return res.status(400).json({
      success: false,
      message: `Validation Error: ${issues}`,
      code: 'VALIDATION_ERROR',
    });
  }

  // Hide internal details in production/general errors
  return res.status(500).json({
    success: false,
    message: 'An unexpected internal server error occurred',
    code: 'INTERNAL_SERVER_ERROR',
  });
}
