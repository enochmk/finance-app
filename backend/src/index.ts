import http from 'http';
import express, { type Application } from 'express';
import helmet from 'helmet';
import hpp from 'hpp';
import morgan from 'morgan';
import { getLogger } from './libs/logger';
import notFoundMiddleware from './middlewares/not-found.middleware';
import errorHandler from './middlewares/error-handler.middleware';

const logger = getLogger('Server');

// Configuration
const PORT = process.env['PORT'] ?? 4000;
const NODE_ENV = process.env['NODE_ENV'] ?? 'development';

const app = express();
const server = http.createServer(app);

// Basic middleware
app.use(morgan('dev'));
app.use(express.json({ limit: '50mb' }));
app.use(helmet());
app.use(hpp());

// Custom middleware

// Routes and error handling
// app.use('/api/v1', routes);
app.use(notFoundMiddleware);
app.use(errorHandler);

server.on('listening', () => {
	logger.info(`Server listening in mode: '${NODE_ENV}' on port: ${PORT}`);
});

server.on('error', async (err) => {
	logger.error(`Server error`, err);
	process.exit(1);
});

server.listen(PORT);

// Start the application
logger.info('Application bootstrap completed successfully');
