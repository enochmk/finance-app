import { Router } from 'express';

import resourceValidator from '../../middlewares/schema-validation.middleware';
import budgetsController from './budgets.controller';
import {
  createBudgetSchema,
  deleteBudgetSchema,
  listBudgetsSchema,
  updateBudgetSchema,
} from './budgets.schema';

const budgetsRoutes = Router();

budgetsRoutes.get(
  '/',
  resourceValidator(listBudgetsSchema),
  budgetsController.list.bind(budgetsController)
);

budgetsRoutes.post(
  '/',
  resourceValidator(createBudgetSchema),
  budgetsController.create.bind(budgetsController)
);

budgetsRoutes.patch(
  '/:id',
  resourceValidator(updateBudgetSchema),
  budgetsController.update.bind(budgetsController)
);

budgetsRoutes.delete(
  '/:id',
  resourceValidator(deleteBudgetSchema),
  budgetsController.remove.bind(budgetsController)
);

export default budgetsRoutes;
