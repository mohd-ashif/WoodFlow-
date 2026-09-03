import express from 'express';
import path from 'path';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
import { errorHandler } from './middleware/errorHandler.js';
import { apiRateLimiter } from './middleware/rateLimiter.js';
import routes from './routes/index.js';
import { prisma } from './config/prisma.js';

export const app = express();

// Trust reverse proxy headers (Render, Cloudflare, AWS load balancers)
app.set('trust proxy', 1);

// Serve static uploaded files in development
app.use('/uploads', express.static(path.join(process.cwd(), 'public', 'uploads')));

const allowedOrigins = env.CORS_ORIGIN.split(',').map((origin) => origin.trim());

// Security Headers (Helmet)
app.use(
  helmet({
    contentSecurityPolicy: env.NODE_ENV === 'production' ? undefined : false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    xFrameOptions: { action: 'deny' },
    xContentTypeOptions: true,
  })
);

// Strict Multi-Origin CORS (Section 42 & Part 9)
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, server-to-server)
      if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
        callback(null, true);
      } else {
        callback(new Error(`CORS origin '${origin}' not permitted.`));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-company-id'],
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Rate limiting (Section 44)
app.use('/api', apiRateLimiter);

// Liveness Check (Part 15)
app.get('/health/liveness', (_req, res) => {
  return res.status(200).json({
    status: 'healthy',
    service: 'furniture-os-api',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// Readiness Check (Part 15)
app.get('/health/readiness', async (_req, res) => {
  try {
    const startTime = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const latencyMs = Date.now() - startTime;
    return res.status(200).json({
      status: 'ready',
      database: 'connected',
      latencyMs,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    return res.status(503).json({
      status: 'unready',
      database: 'disconnected',
      error: err instanceof Error ? err.message : 'Database ping failed',
      timestamp: new Date().toISOString(),
    });
  }
});

// Comprehensive Health check endpoint (Part 15 & Part 16)
app.get('/health', async (_req, res) => {
  try {
    const startTime = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const dbLatencyMs = Date.now() - startTime;

    return res.status(200).json({
      status: 'healthy',
      service: 'furniture-os-api',
      version: env.VERSION,
      environment: env.NODE_ENV,
      uptime: `${Math.floor(process.uptime())}s`,
      memoryUsage: process.memoryUsage(),
      checks: {
        database: {
          status: 'connected',
          latencyMs: dbLatencyMs,
        },
      },
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    return res.status(500).json({
      status: 'unhealthy',
      service: 'furniture-os-api',
      version: env.VERSION,
      environment: env.NODE_ENV,
      checks: {
        database: {
          status: 'disconnected',
          error: err instanceof Error ? err.message : 'Database error',
        },
      },
      timestamp: new Date().toISOString(),
    });
  }
});

// API v1 Routes (Section 45)
app.use('/api/v1', routes);

// Centralized error handler (Section 34)
app.use(errorHandler);

