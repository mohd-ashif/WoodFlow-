import { PrismaClient } from '@prisma/client';
import { logger } from './logger.js';

export const prisma = new PrismaClient({
  log:
    process.env.NODE_ENV === 'development'
      ? [{ emit: 'event', level: 'query' }, 'error', 'warn']
      : ['error'],
});

if (process.env.NODE_ENV === 'development') {
  (prisma as any).$on('query', (e: any) => {
    if (e.duration > 200) {
      logger.warn({ query: e.query, durationMs: e.duration }, 'Slow Query Detected (>200ms)');
    }
  });
}

// Graceful disconnect on exit
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

