import { Router } from 'express';

import resourceValidator from '../../middlewares/schema-validation.middleware';
import requireAuth from '../../middlewares/require-auth.middleware';
import authController from './auth.controller';
import { loginSchema, registerSchema } from './auth.schema';

const authRoutes = Router();

authRoutes.post(
  '/register',
  resourceValidator(registerSchema),
  authController.register.bind(authController)
);

authRoutes.post(
  '/login',
  resourceValidator(loginSchema),
  authController.login.bind(authController)
);

authRoutes.get('/me', requireAuth, authController.me.bind(authController));

export default authRoutes;
