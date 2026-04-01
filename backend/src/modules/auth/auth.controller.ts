import type { NextFunction, Request, Response } from 'express';

import type { LoginBody, RegisterBody } from './auth.schema';
import authService from './auth.service';

type EmptyObject = Record<string, never>;
type RegisterRequest = Request<EmptyObject, unknown, RegisterBody, EmptyObject>;
type LoginRequest = Request<EmptyObject, unknown, LoginBody, EmptyObject>;

class AuthController {
  register = async (
    req: RegisterRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const result = await authService.register(req.body);

      return res.status(201).json({
        data: result,
      });
    } catch (error) {
      return next(error);
    }
  };

  login = async (req: LoginRequest, res: Response, next: NextFunction) => {
    try {
      const result = await authService.login(req.body);

      return res.status(200).json({
        data: result,
      });
    } catch (error) {
      return next(error);
    }
  };

  me = async (req: Request, res: Response) => {
    return res.status(200).json({
      data: req.user,
    });
  };
}

const authController = new AuthController();

export default authController;
