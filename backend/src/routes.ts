import { Router } from 'express';

import accountsRoutes from './features/accounts/accounts.routes';
import authRoutes from './features/auth/auth.routes';
import budgetsRoutes from './features/budgets/budgets.routes';
import categoriesRoutes from './features/categories/categories.routes';
import dashboardRoutes from './features/dashboard/dashboard.routes';
import recurringTransactionsRoutes from './features/recurring-transactions/recurring-transactions.routes';
import reportsRoutes from './features/reports/reports.routes';
import transactionsRoutes from './features/transactions/transactions.routes';
import healthRoutes from './features/health/health.routes';

const apiRoutes = Router();

apiRoutes.use('/health', healthRoutes);
apiRoutes.use('/auth', authRoutes);
apiRoutes.use('/accounts', accountsRoutes);
apiRoutes.use('/categories', categoriesRoutes);
apiRoutes.use('/transactions', transactionsRoutes);
apiRoutes.use('/dashboard', dashboardRoutes);
apiRoutes.use('/reports', reportsRoutes);
apiRoutes.use('/budgets', budgetsRoutes);
apiRoutes.use('/recurring-transactions', recurringTransactionsRoutes);

export default apiRoutes;
