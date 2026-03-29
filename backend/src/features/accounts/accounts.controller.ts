import type { NextFunction, Request, Response } from 'express';

import accountsService from './accounts.service';
import type {
  CreateAccountBody,
  DeleteAccountParams,
  ListAccountsQuery,
  ReorderAccountsBody,
  UpdateAccountBody,
  UpdateAccountParams,
} from './accounts.schema';

type EmptyObject = Record<string, never>;
type ListAccountsRequest = Request<
  EmptyObject,
  unknown,
  EmptyObject,
  ListAccountsQuery
>;
type CreateAccountRequest = Request<
  EmptyObject,
  unknown,
  CreateAccountBody,
  EmptyObject
>;
type UpdateAccountRequest = Request<
  UpdateAccountParams,
  unknown,
  UpdateAccountBody,
  EmptyObject
>;
type DeleteAccountRequest = Request<DeleteAccountParams>;

class AccountsController {
  list = async (
    req: ListAccountsRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const accounts = await accountsService.list(req.user!.id, req.query);

      return res.status(200).json({
        data: accounts,
        count: accounts.length,
      });
    } catch (error) {
      return next(error);
    }
  };

  create = async (
    req: CreateAccountRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const account = await accountsService.create(req.user!.id, req.body);

      return res.status(201).json({
        data: account,
      });
    } catch (error) {
      return next(error);
    }
  };

  update = async (
    req: UpdateAccountRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const account = await accountsService.update(
        req.params.id,
        req.user!.id,
        req.body
      );

      return res.status(200).json({
        data: account,
      });
    } catch (error) {
      return next(error);
    }
  };

  remove = async (
    req: DeleteAccountRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const account = await accountsService.remove(req.params.id, req.user!.id);

      return res.status(200).json({
        data: account,
        message: 'Account deleted successfully',
      });
    } catch (error) {
      return next(error);
    }
  };

  reorder = async (
    req: Request<Record<string, never>, unknown, ReorderAccountsBody>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const accounts = await accountsService.reorder(
        req.user!.id,
        req.body.orderedIds
      );

      return res.status(200).json({
        data: accounts,
      });
    } catch (error) {
      return next(error);
    }
  };
}

const accountsController = new AccountsController();

export default accountsController;
