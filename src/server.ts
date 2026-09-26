import app from './app.js';
import { env, validateEnv } from './config/env.js';
import { logger } from './utils/logger.js';

// Validate configuration on startup
validateEnv();


const server = app.listen(env.PORT, () => {
  logger.info(`====================================================`);
  logger.info(`🚀 Saro Agency CMS Backend Server is running!`);
  logger.info(`📡 Port:        http://localhost:${env.PORT}`);
  logger.info(`🌍 Environment: ${env.NODE_ENV}`);
  logger.info(`🔗 API Base:    http://localhost:${env.PORT}/api/v1`);
  logger.info(`🛡️ Supabase:    ${env.SUPABASE_URL ? 'Connected' : 'Missing URL'}`);
  logger.info(`🖼️ Cloudinary:  ${env.CLOUDINARY_CLOUD_NAME ? env.CLOUDINARY_CLOUD_NAME : 'Missing cloud_name'}`);
  logger.info(`====================================================`);
});

// Graceful shutdown handling
const handleGracefulShutdown = (signal: string) => {
  logger.info(`Received ${signal}. Shutting down server gracefully...`);
  server.close(() => {
    logger.info('HTTP server closed.');
    process.exit(0);
  });

  // Force shutdown after 10s if connections refuse to close
  setTimeout(() => {
    logger.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => handleGracefulShutdown('SIGTERM'));
process.on('SIGINT', () => handleGracefulShutdown('SIGINT'));

export default server;
