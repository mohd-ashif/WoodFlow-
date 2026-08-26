import { app } from './app.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';

app.listen(env.PORT, () => {
  logger.info(`🚀 FurnitureOS Backend API running on port ${env.PORT} in [${env.NODE_ENV}] mode`);
  logger.info(`🔗 Health Check: http://localhost:${env.PORT}/health`);
  logger.info(`🔗 API v1 Entry: http://localhost:${env.PORT}/api/v1`);
});
