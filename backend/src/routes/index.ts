import { Router } from 'express';

import accountsRoutes from '../features/accounts/accounts.routes';
import categoriesRoutes from '../features/categories/categories.routes';
import transactionsRoutes from '../features/transactions/transactions.routes';
import healthRoutes from './health.routes';

const apiRoutes = Router();

apiRoutes.use('/health', healthRoutes);
apiRoutes.use('/accounts', accountsRoutes);
apiRoutes.use('/categories', categoriesRoutes);
apiRoutes.use('/transactions', transactionsRoutes);

export default apiRoutes;
