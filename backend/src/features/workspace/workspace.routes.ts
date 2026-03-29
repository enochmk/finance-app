import { Router } from 'express';

import requireAuth from '../../middlewares/require-auth.middleware';
import resourceValidator from '../../middlewares/schema-validation.middleware';
import workspaceController from './workspace.controller';
import { resetWorkspaceSchema } from './workspace.schema';

const workspaceRoutes = Router();

workspaceRoutes.use(requireAuth);

workspaceRoutes.post(
  '/reset',
  resourceValidator(resetWorkspaceSchema),
  workspaceController.reset
);

export default workspaceRoutes;
