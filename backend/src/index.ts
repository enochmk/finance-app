import http from 'http';

import './env';
import env from './env';
import { getLogger } from './libs/logger';
import prisma from './libs/prisma';
import { ensureCurrencies } from './libs/currencies';
import { createApp } from './app';
// import { bootstrapDevData } from './scripts/bootstrap-dev';

const logger = getLogger('Server');

// Configuration
const PORT = env.PORT;
const NODE_ENV = env.NODE_ENV;

const app = createApp();
const server = http.createServer(app);

const shutdown = async (signal: string) => {
  logger.info(`Received ${signal}. Closing server and Prisma connections`);
  await prisma.$disconnect();
  server.close(() => {
    process.exit(0);
  });
};

server.on('listening', () => {
  logger.info(`Server listening in mode: '${NODE_ENV}' on port: ${PORT}`);
  void ensureCurrencies().catch((err) => {
    logger.error('Failed to seed default currencies', { err });
  });
});

server.on('error', async (err) => {
  logger.error(`Server error`, err);
  process.exit(1);
});

// void bootstrapDevData().catch((error) => {
//   logger.error('Development bootstrap failed', { error });
// });

process.on('SIGINT', async () => {
  await shutdown('SIGINT');
});

process.on('SIGTERM', async () => {
  await shutdown('SIGTERM');
});

server.listen(PORT);

// Start the application
logger.info('Application bootstrap completed successfully');
