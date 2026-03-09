import { Router } from 'express';

import requireAuth from '../../middlewares/require-auth.middleware';
import resourceValidator from '../../middlewares/schema-validation.middleware';
import recurringTransactionsController from './recurring-transactions.controller';
import {
  ensureOwnedRecurringTransactionAccess,
  validateCreateRecurringTransactionOwnership,
  validateUpdateRecurringTransactionOwnership,
} from './recurring-transactions.middleware';
import {
  createRecurringTransactionSchema,
  deleteRecurringTransactionSchema,
  listRecurringTransactionsSchema,
  runRecurringTransactionsSchema,
  updateRecurringTransactionSchema,
} from './recurring-transactions.schema';

const recurringTransactionsRoutes = Router();

recurringTransactionsRoutes.use(requireAuth);

recurringTransactionsRoutes.get(
  '/',
  resourceValidator(listRecurringTransactionsSchema),
  recurringTransactionsController.list
);

recurringTransactionsRoutes.post(
  '/',
  resourceValidator(createRecurringTransactionSchema),
  validateCreateRecurringTransactionOwnership,
  recurringTransactionsController.create
);

recurringTransactionsRoutes.patch(
  '/:id',
  resourceValidator(updateRecurringTransactionSchema),
  validateUpdateRecurringTransactionOwnership,
  recurringTransactionsController.update
);

recurringTransactionsRoutes.delete(
  '/:id',
  resourceValidator(deleteRecurringTransactionSchema),
  ensureOwnedRecurringTransactionAccess,
  recurringTransactionsController.remove
);

recurringTransactionsRoutes.post(
  '/run-due',
  resourceValidator(runRecurringTransactionsSchema),
  recurringTransactionsController.runDue
);

export default recurringTransactionsRoutes;
