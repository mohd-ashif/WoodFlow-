import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger.js';
import crypto from 'crypto';

export function apiTimingMiddleware(req: Request, res: Response, next: NextFunction) {
  const startTime = process.hrtime.bigint();
  
  // Assign or preserve Request ID
  const requestId = (req.headers['x-request-id'] as string) || crypto.randomUUID();
  req.headers['x-request-id'] = requestId;
  res.setHeader('X-Request-Id', requestId);

  // Hook into response finish event to calculate elapsed latency
  res.on('finish', () => {
    const endTime = process.hrtime.bigint();
    const durationMs = Number(endTime - startTime) / 1e6;
    const roundedMs = Math.round(durationMs * 100) / 100;

    // Structured timing metric safely without sensitive parameters
    logger.info({
      requestId,
      method: req.method,
      path: req.originalUrl || req.url,
      statusCode: res.statusCode,
      responseTimeMs: roundedMs,
      tenantId: (req as any).tenantId || undefined,
    }, `API Timing: ${req.method} ${req.originalUrl || req.url} ${res.statusCode} ${roundedMs}ms`);
  });

  next();
}
