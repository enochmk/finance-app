import type { NextFunction, Request, Response } from 'express';

import recurringTransactionsService from './recurring-transactions.service';
import type {
  CreateRecurringTransactionBody,
  DeleteRecurringTransactionParams,
  ListRecurringTransactionsQuery,
  RunRecurringTransactionsQuery,
  UpdateRecurringTransactionBody,
  UpdateRecurringTransactionParams,
} from './recurring-transactions.schema';

type EmptyObject = Record<string, never>;
type ListRecurringTransactionsRequest = Request<
  EmptyObject,
  unknown,
  EmptyObject,
  ListRecurringTransactionsQuery
>;
type CreateRecurringTransactionRequest = Request<
  EmptyObject,
  unknown,
  CreateRecurringTransactionBody,
  EmptyObject
>;
type UpdateRecurringTransactionRequest = Request<
  UpdateRecurringTransactionParams,
  unknown,
  UpdateRecurringTransactionBody,
  EmptyObject
>;
type DeleteRecurringTransactionRequest =
  Request<DeleteRecurringTransactionParams>;
type RunRecurringTransactionsRequest = Request<
  EmptyObject,
  unknown,
  EmptyObject,
  RunRecurringTransactionsQuery
>;

class RecurringTransactionsController {
  list = async (
    req: ListRecurringTransactionsRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const recurringTransactions = await recurringTransactionsService.list(
        req.user!.id,
        req.query
      );

      return res.status(200).json({
        data: recurringTransactions,
        count: recurringTransactions.length,
      });
    } catch (error) {
      return next(error);
    }
  };

  create = async (
    req: CreateRecurringTransactionRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const recurringTransaction = await recurringTransactionsService.create(
        req.user!.id,
        req.body
      );

      return res.status(201).json({
        data: recurringTransaction,
      });
    } catch (error) {
      return next(error);
    }
  };

  update = async (
    req: UpdateRecurringTransactionRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const recurringTransaction = await recurringTransactionsService.update(
        req.params.id,
        req.body
      );

      return res.status(200).json({
        data: recurringTransaction,
      });
    } catch (error) {
      return next(error);
    }
  };

  remove = async (
    req: DeleteRecurringTransactionRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const recurringTransaction = await recurringTransactionsService.remove(
        req.params.id
      );

      return res.status(200).json({
        data: recurringTransaction,
        message: 'Recurring transaction deleted successfully',
      });
    } catch (error) {
      return next(error);
    }
  };

  runDue = async (
    req: RunRecurringTransactionsRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const result = await recurringTransactionsService.runDueTransactions(
        req.user!.id,
        req.query
      );

      return res.status(200).json({
        data: result,
      });
    } catch (error) {
      return next(error);
    }
  };
}

const recurringTransactionsController = new RecurringTransactionsController();

export default recurringTransactionsController;
