import { Router } from 'express';

import accountsRoutes from '../features/accounts/accounts.routes';
import authRoutes from '../features/auth/auth.routes';
import budgetsRoutes from '../features/budgets/budgets.routes';
import categoriesRoutes from '../features/categories/categories.routes';
import dashboardRoutes from '../features/dashboard/dashboard.routes';
import recurringTransactionsRoutes from '../features/recurring-transactions/recurring-transactions.routes';
import reportsRoutes from '../features/reports/reports.routes';
import transactionsRoutes from '../features/transactions/transactions.routes';
import healthRoutes from './health.routes';

const apiRoutes = Router();

apiRoutes.use('/health', healthRoutes);
apiRoutes.use('/auth', authRoutes);
apiRoutes.use('/accounts', accountsRoutes);
apiRoutes.use('/budgets', budgetsRoutes);
apiRoutes.use('/categories', categoriesRoutes);
apiRoutes.use('/dashboard', dashboardRoutes);
apiRoutes.use('/recurring-transactions', recurringTransactionsRoutes);
apiRoutes.use('/reports', reportsRoutes);
apiRoutes.use('/transactions', transactionsRoutes);

export default apiRoutes;
