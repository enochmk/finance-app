import { Router } from 'express';

import resourceValidator from '../../middlewares/schema-validation.middleware';
import accountsController from './accounts.controller';
import {
  createAccountSchema,
  deleteAccountSchema,
  listAccountsSchema,
  updateAccountSchema,
} from './accounts.schema';

const accountsRoutes = Router();

accountsRoutes.get(
  '/',
  resourceValidator(listAccountsSchema),
  accountsController.list.bind(accountsController)
);

accountsRoutes.post(
  '/',
  resourceValidator(createAccountSchema),
  accountsController.create.bind(accountsController)
);

accountsRoutes.patch(
  '/:id',
  resourceValidator(updateAccountSchema),
  accountsController.update.bind(accountsController)
);

accountsRoutes.delete(
  '/:id',
  resourceValidator(deleteAccountSchema),
  accountsController.remove.bind(accountsController)
);

export default accountsRoutes;
