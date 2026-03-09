import express from 'express';
import type { CorsOptions } from 'cors';
import helmet from 'helmet';
import hpp from 'hpp';
import morgan from 'morgan';
import rtracer from 'cls-rtracer';
import cors from 'cors';

import './env';
import env from './env';
import requestLogger from './middlewares/request-logger.middleware';
import sanitizeInput from './middlewares/sanitization.middleware';
import notFoundMiddleware from './middlewares/not-found.middleware';
import errorHandler from './middlewares/error-handler.middleware';
import apiRoutes from './routes';

const allowedOrigins = env.FRONTEND_ORIGINS.split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error(`Origin ${origin} is not allowed by CORS`));
  },
  credentials: true,
};

export function createApp() {
  const app = express();

  app.use(morgan('dev'));
  app.use(rtracer.expressMiddleware());
  app.use(cors(corsOptions));
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(helmet());
  app.use(hpp());

  app.use(sanitizeInput);
  app.use(requestLogger);

  app.use('/api/v1', apiRoutes);
  app.use(notFoundMiddleware);
  app.use(errorHandler);

  return app;
}

export default createApp;
