import { Router } from 'express';

import transactionsRoutes from '../features/transactions/transactions.routes';
import healthRoutes from './health.routes';

const apiRoutes = Router();

apiRoutes.use('/health', healthRoutes);
apiRoutes.use('/transactions', transactionsRoutes);

export default apiRoutes;
