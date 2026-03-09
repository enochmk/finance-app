import { Router } from 'express';

import requireAuth from '../../middlewares/require-auth.middleware';
import resourceValidator from '../../middlewares/schema-validation.middleware';
import transactionsController from './transactions.controller';
import {
  ensureOwnedTransactionAccess,
  validateCreateTransactionOwnership,
  validateUpdateTransactionOwnership,
} from './transactions.middleware';
import {
  createTransactionSchema,
  deleteTransactionSchema,
  listTransactionsSchema,
  updateTransactionSchema,
} from './transactions.schema';

const transactionsRoutes = Router();

transactionsRoutes.use(requireAuth);

transactionsRoutes.get(
  '/',
  resourceValidator(listTransactionsSchema),
  transactionsController.list
);

transactionsRoutes.post(
  '/',
  resourceValidator(createTransactionSchema),
  validateCreateTransactionOwnership,
  transactionsController.create
);

transactionsRoutes.patch(
  '/:id',
  resourceValidator(updateTransactionSchema),
  validateUpdateTransactionOwnership,
  transactionsController.update
);

transactionsRoutes.delete(
  '/:id',
  resourceValidator(deleteTransactionSchema),
  ensureOwnedTransactionAccess,
  transactionsController.remove
);

export default transactionsRoutes;
