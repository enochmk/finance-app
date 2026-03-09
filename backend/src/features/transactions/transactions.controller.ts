import type { NextFunction, Request, Response } from 'express';

import transactionsService from './transactions.service';
import type {
  CreateTransactionInput,
  ListTransactionsInput,
  UpdateTransactionInput,
} from './transactions.schema';

class TransactionsController {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const transactions = await transactionsService.list(
        String(req.user?.id),
        req.query as unknown as ListTransactionsInput
      );

      return res.status(200).json({
        data: transactions,
        count: transactions.length,
      });
    } catch (error) {
      return next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const transaction = await transactionsService.create(
        String(req.user?.id),
        req.body as CreateTransactionInput
      );

      return res.status(201).json({
        data: transaction,
      });
    } catch (error) {
      return next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const transaction = await transactionsService.update(
        String(req.params.id),
        String(req.user?.id),
        req.body as UpdateTransactionInput
      );

      return res.status(200).json({
        data: transaction,
      });
    } catch (error) {
      return next(error);
    }
  }

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      const transaction = await transactionsService.remove(
        String(req.params.id),
        String(req.user?.id)
      );

      return res.status(200).json({
        data: transaction,
        message: 'Transaction deleted successfully',
      });
    } catch (error) {
      return next(error);
    }
  }
}

const transactionsController = new TransactionsController();

export default transactionsController;
