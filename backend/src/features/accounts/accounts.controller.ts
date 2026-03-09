import type { NextFunction, Request, Response } from 'express';

import accountsService from './accounts.service';
import type {
  CreateAccountInput,
  ListAccountsInput,
  UpdateAccountInput,
} from './accounts.schema';

class AccountsController {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const accounts = await accountsService.list(
        String(req.user?.id),
        req.query as unknown as ListAccountsInput
      );

      return res.status(200).json({
        data: accounts,
        count: accounts.length,
      });
    } catch (error) {
      return next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const account = await accountsService.create(
        String(req.user?.id),
        req.body as CreateAccountInput
      );

      return res.status(201).json({
        data: account,
      });
    } catch (error) {
      return next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const account = await accountsService.update(
        String(req.params.id),
        String(req.user?.id),
        req.body as UpdateAccountInput
      );

      return res.status(200).json({
        data: account,
      });
    } catch (error) {
      return next(error);
    }
  }

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      const account = await accountsService.remove(
        String(req.params.id),
        String(req.user?.id)
      );

      return res.status(200).json({
        data: account,
        message: 'Account deleted successfully',
      });
    } catch (error) {
      return next(error);
    }
  }
}

const accountsController = new AccountsController();

export default accountsController;
