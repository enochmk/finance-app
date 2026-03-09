import { Router } from 'express';

import resourceValidator from '../../middlewares/schema-validation.middleware';
import requireAuth from '../../middlewares/require-auth.middleware';
import authController from './auth.controller';
import { loginSchema, registerSchema } from './auth.schema';

const authRoutes = Router();

authRoutes.post(
  '/register',
  resourceValidator(registerSchema),
  authController.register
);

authRoutes.post('/login', resourceValidator(loginSchema), authController.login);

authRoutes.get('/me', requireAuth, authController.me);

export default authRoutes;
