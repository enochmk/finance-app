import type { NextFunction, Request, Response } from 'express';

import budgetsService from './budgets.service';
import type {
  CreateBudgetInput,
  ListBudgetsInput,
  UpdateBudgetInput,
} from './budgets.schema';

class BudgetsController {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const budgets = await budgetsService.list(
        req.query as unknown as ListBudgetsInput
      );

      return res.status(200).json({
        data: budgets,
        count: budgets.length,
      });
    } catch (error) {
      return next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const budget = await budgetsService.create(req.body as CreateBudgetInput);

      return res.status(201).json({
        data: budget,
      });
    } catch (error) {
      return next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const budget = await budgetsService.update(
        String(req.params.id),
        req.body as UpdateBudgetInput
      );

      return res.status(200).json({
        data: budget,
      });
    } catch (error) {
      return next(error);
    }
  }

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      const budget = await budgetsService.remove(
        String(req.params.id),
        String(req.query.userId)
      );

      return res.status(200).json({
        data: budget,
        message: 'Budget deleted successfully',
      });
    } catch (error) {
      return next(error);
    }
  }
}

const budgetsController = new BudgetsController();

export default budgetsController;
