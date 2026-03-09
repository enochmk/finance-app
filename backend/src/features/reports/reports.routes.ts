import { Router } from 'express';

import requireAuth from '../../middlewares/require-auth.middleware';
import resourceValidator from '../../middlewares/schema-validation.middleware';
import reportsController from './reports.controller';
import { getMonthlyReportSchema } from './reports.schema';

const reportsRoutes = Router();

reportsRoutes.use(requireAuth);

reportsRoutes.get(
  '/monthly',
  resourceValidator(getMonthlyReportSchema),
  reportsController.getMonthlyReport.bind(reportsController)
);

export default reportsRoutes;
