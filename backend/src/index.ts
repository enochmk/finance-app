import http from 'http';
import express, { type Application } from 'express';
import helmet from 'helmet';
import hpp from 'hpp';
import morgan from 'morgan';
import rtracer from 'cls-rtracer';

import './env';
import env from './env';
import { getLogger } from './libs/logger';
import prisma from './libs/prisma';
import requestLogger from './middlewares/request-logger.middleware';
import sanitizeInput from './middlewares/sanitization.middleware';
import notFoundMiddleware from './middlewares/not-found.middleware';
import errorHandler from './middlewares/error-handler.middleware';
import apiRoutes from './routes';
import { bootstrapDevData } from './scripts/bootstrap-dev';

const logger = getLogger('Server');

// Configuration
const PORT = env.PORT;
const NODE_ENV = env.NODE_ENV;

const app = express();
const server = http.createServer(app);

// Basic middleware
app.use(morgan('dev'));
app.use(rtracer.expressMiddleware());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(helmet());
app.use(hpp());

// Custom middleware
app.use(sanitizeInput);
app.use(requestLogger);

// Routes and error handling
app.use('/api/v1', apiRoutes);
app.use(notFoundMiddleware);
app.use(errorHandler);

const shutdown = async (signal: string) => {
  logger.info(`Received ${signal}. Closing server and Prisma connections`);
  await prisma.$disconnect();
  server.close(() => {
    process.exit(0);
  });
};

server.on('listening', () => {
  logger.info(`Server listening in mode: '${NODE_ENV}' on port: ${PORT}`);
});

server.on('error', async (err) => {
  logger.error(`Server error`, err);
  process.exit(1);
});

void bootstrapDevData().catch((error) => {
  logger.error('Development bootstrap failed', { error });
});

process.on('SIGINT', async () => {
  await shutdown('SIGINT');
});

process.on('SIGTERM', async () => {
  await shutdown('SIGTERM');
});

server.listen(PORT);

// Start the application
logger.info('Application bootstrap completed successfully');
