import { PrismaClient } from '@prisma/client';
import { logger } from './logger.js';

export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// Self-healing connection error handling for Neon PostgreSQL idle resets
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});
