import rateLimit from 'express-rate-limit';

const isProd = process.env.NODE_ENV === 'production';

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isProd ? 20 : 10000, // Higher limit for dev/test suite execution
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts. Please try again in 15 minutes.',
    code: 'TOO_MANY_REQUESTS',
  },
});

export const accessRequestRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: isProd ? 10 : 5000,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many access requests submitted. Please try again later.',
    code: 'TOO_MANY_REQUESTS',
  },
});

export const importRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isProd ? 30 : 5000,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many import requests. Please wait a few minutes before uploading more data.',
    code: 'TOO_MANY_REQUESTS',
  },
});

export const apiRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: isProd ? 150 : 50000,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests. Please slow down.',
    code: 'TOO_MANY_REQUESTS',
  },
});

