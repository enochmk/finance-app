import { Router } from 'express';

import requireAuth from '../../middlewares/require-auth.middleware';
import resourceValidator from '../../middlewares/schema-validation.middleware';
import transactionsController from './transactions.controller';
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
  transactionsController.list.bind(transactionsController)
);

transactionsRoutes.post(
  '/',
  resourceValidator(createTransactionSchema),
  transactionsController.create.bind(transactionsController)
);

transactionsRoutes.patch(
  '/:id',
  resourceValidator(updateTransactionSchema),
  transactionsController.update.bind(transactionsController)
);

transactionsRoutes.delete(
  '/:id',
  resourceValidator(deleteTransactionSchema),
  transactionsController.remove.bind(transactionsController)
);

export default transactionsRoutes;
