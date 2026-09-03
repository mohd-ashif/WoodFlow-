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
  // Extract contextual debugging info without logging secrets
  const companyId = req.headers['x-company-id'] || (req as unknown as { user?: { companyId?: string } }).user?.companyId;
  const userId = (req as unknown as { user?: { id?: string } }).user?.id;
  const ipAddress = req.ip || req.headers['x-forwarded-for'];
  const userAgent = req.headers['user-agent'];

  logger.error(
    {
      err,
      path: req.path,
      method: req.method,
      companyId,
      userId,
      ipAddress,
      userAgent,
    },
    'Request Processing Failure'
  );

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

  // Handle Prisma / Neon PostgreSQL connection resets gracefully
  if (err.message && (err.message.includes('10054') || err.message.includes('ConnectionReset') || err.message.includes('Connection closed'))) {
    return res.status(503).json({
      success: false,
      message: 'Database connection was temporarily reset. Please try your request again.',
      code: 'DATABASE_CONNECTION_RESET',
    });
  }

  // Hide internal details in production/general errors
  return res.status(500).json({
    success: false,
    message: 'An unexpected internal server error occurred. Please contact system support if this issue persists.',
    code: 'INTERNAL_SERVER_ERROR',
  });
}

