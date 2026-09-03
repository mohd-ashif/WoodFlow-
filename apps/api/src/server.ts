import { app } from './app.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { prisma } from './config/prisma.js';

const server = app.listen(env.PORT, () => {
  logger.info(`🚀 FurnitureOS Backend API v${env.VERSION} running on port ${env.PORT} in [${env.NODE_ENV}] mode`);
  logger.info(`🔗 Health Check: http://localhost:${env.PORT}/health`);
  logger.info(`🔗 API v1 Entry: http://localhost:${env.PORT}/api/v1`);
});

// Graceful Shutdown Handler (Section 22 & Part 22)
const gracefulShutdown = async (signal: string) => {
  logger.info(`⚠️ Received ${signal}. Initiating graceful shutdown...`);

  server.close(async () => {
    logger.info('HTTP server closed.');
    try {
      await prisma.$disconnect();
      logger.info('Database connections closed cleanly.');
      process.exit(0);
    } catch (err) {
      logger.error({ err }, 'Error disconnecting database during shutdown');
      process.exit(1);
    }
  });

  // Force shutdown after 10 seconds if connections are stuck
  setTimeout(() => {
    logger.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

