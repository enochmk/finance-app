import type { NextFunction, Request, Response } from 'express';

import transactionsService from './transactions.service';
import type {
  CreateTransactionBody,
  DeleteTransactionParams,
  ListTransactionsQuery,
  UpdateTransactionBody,
  UpdateTransactionParams,
} from './transactions.schema';

type EmptyObject = Record<string, never>;
type ListTransactionsRequest = Request<
  EmptyObject,
  unknown,
  EmptyObject,
  ListTransactionsQuery
>;
type CreateTransactionRequest = Request<
  EmptyObject,
  unknown,
  CreateTransactionBody,
  EmptyObject
>;
type UpdateTransactionRequest = Request<
  UpdateTransactionParams,
  unknown,
  UpdateTransactionBody,
  EmptyObject
>;
type DeleteTransactionRequest = Request<DeleteTransactionParams>;

class TransactionsController {
  list = async (
    req: ListTransactionsRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const transactions = await transactionsService.list(
        req.user!.id,
        req.query
      );

      return res.status(200).json({
        data: transactions,
        count: transactions.length,
      });
    } catch (error) {
      return next(error);
    }
  };

  create = async (
    req: CreateTransactionRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const transaction = await transactionsService.create(
        req.user!.id,
        req.body
      );

      return res.status(201).json({
        data: transaction,
      });
    } catch (error) {
      return next(error);
    }
  };

  update = async (
    req: UpdateTransactionRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const transaction = await transactionsService.update(
        req.params.id,
        req.user!.id,
        req.body
      );

      return res.status(200).json({
        data: transaction,
      });
    } catch (error) {
      return next(error);
    }
  };

  remove = async (
    req: DeleteTransactionRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const transaction = await transactionsService.remove(
        req.params.id,
        req.user!.id
      );

      return res.status(200).json({
        data: transaction,
        message: 'Transaction deleted successfully',
      });
    } catch (error) {
      return next(error);
    }
  };
}

const transactionsController = new TransactionsController();

export default transactionsController;
