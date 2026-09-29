import app from './app.js';
import { env, validateEnv } from './config/env.js';
import { logger } from './utils/logger.js';

// Validate configuration on startup
validateEnv();


const server = app.listen(env.PORT, () => {
  logger.info(`Server started on port ${env.PORT}`);
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
