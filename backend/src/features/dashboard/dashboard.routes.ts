import { Router } from 'express';

import requireAuth from '../../middlewares/require-auth.middleware';
import resourceValidator from '../../middlewares/schema-validation.middleware';
import dashboardController from './dashboard.controller';
import { getDashboardSummarySchema } from './dashboard.schema';

const dashboardRoutes = Router();

dashboardRoutes.use(requireAuth);

dashboardRoutes.get(
  '/summary',
  resourceValidator(getDashboardSummarySchema),
  dashboardController.getSummary.bind(dashboardController)
);

export default dashboardRoutes;
