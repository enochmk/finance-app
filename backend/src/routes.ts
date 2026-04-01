import { Router } from 'express';

import healthRoutes from './modules/health/health.routes';
import authRoutes from './modules/auth/auth.routes';
import dashboardRoutes from './modules/dashboard/dashboard.routes';
import accountsRoutes from './modules/accounts/accounts.routes';
import categoriesRoutes from './modules/categories/categories.routes';
import currenciesRoutes from './modules/currencies/currencies.routes';
import reportsRoutes from './modules/reports/reports.routes';
import transactionsRoutes from './modules/transactions/transactions.routes';
import workspaceRoutes from './modules/workspace/workspace.routes';

const apiRoutes = Router();

apiRoutes.use('/health', healthRoutes);
apiRoutes.use('/auth', authRoutes);
apiRoutes.use('/accounts', accountsRoutes);
apiRoutes.use('/categories', categoriesRoutes);
apiRoutes.use('/currencies', currenciesRoutes);
apiRoutes.use('/transactions', transactionsRoutes);
apiRoutes.use('/dashboard', dashboardRoutes);
apiRoutes.use('/reports', reportsRoutes);
apiRoutes.use('/workspace', workspaceRoutes);

export default apiRoutes;
