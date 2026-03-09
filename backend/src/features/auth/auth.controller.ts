import type { NextFunction, Request, Response } from 'express';

import type { LoginInput, RegisterInput } from './auth.schema';
import authService from './auth.service';

class AuthController {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.register(req.body as RegisterInput);

      return res.status(201).json({
        data: result,
      });
    } catch (error) {
      return next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.login(req.body as LoginInput);

      return res.status(200).json({
        data: result,
      });
    } catch (error) {
      return next(error);
    }
  }

  async me(req: Request, res: Response) {
    return res.status(200).json({
      data: req.user,
    });
  }
}

const authController = new AuthController();

export default authController;
