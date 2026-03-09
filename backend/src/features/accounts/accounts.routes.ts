import { Router } from 'express';

import requireAuth from '../../middlewares/require-auth.middleware';
import resourceValidator from '../../middlewares/schema-validation.middleware';
import accountsController from './accounts.controller';
import {
  createAccountSchema,
  deleteAccountSchema,
  listAccountsSchema,
  updateAccountSchema,
} from './accounts.schema';

const accountsRoutes = Router();

accountsRoutes.use(requireAuth);

accountsRoutes.get(
  '/',
  resourceValidator(listAccountsSchema),
  accountsController.list
);

accountsRoutes.post(
  '/',
  resourceValidator(createAccountSchema),
  accountsController.create
);

accountsRoutes.patch(
  '/:id',
  resourceValidator(updateAccountSchema),
  accountsController.update
);

accountsRoutes.delete(
  '/:id',
  resourceValidator(deleteAccountSchema),
  accountsController.remove
);

export default accountsRoutes;
