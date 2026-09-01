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

// Serve static uploaded files in development
app.use('/uploads', express.static(path.join(process.cwd(), 'public', 'uploads')));

// Security Headers (Helmet)
app.use(
  helmet({
    contentSecurityPolicy: false, // Avoid breaking frontend SSR or local Dev tools
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// Strict CORS (Section 42)
app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-company-id'],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Rate limiting (Section 44)
app.use('/api', apiRateLimiter);

// Health check endpoint (Section 40)
app.get('/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return res.status(200).json({ status: 'ok', database: 'connected' });
  } catch {
    return res.status(500).json({ status: 'error', database: 'disconnected' });
  }
});

// API v1 Routes (Section 45)
app.use('/api/v1', routes);

// Centralized error handler (Section 34)
app.use(errorHandler);
