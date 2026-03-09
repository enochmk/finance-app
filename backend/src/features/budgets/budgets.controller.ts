import type { NextFunction, Request, Response } from 'express';

import budgetsService from './budgets.service';
import type {
  CreateBudgetBody,
  DeleteBudgetParams,
  ListBudgetsQuery,
  UpdateBudgetBody,
  UpdateBudgetParams,
} from './budgets.schema';

type EmptyObject = Record<string, never>;
type ListBudgetsRequest = Request<
  EmptyObject,
  unknown,
  EmptyObject,
  ListBudgetsQuery
>;
type CreateBudgetRequest = Request<
  EmptyObject,
  unknown,
  CreateBudgetBody,
  EmptyObject
>;
type UpdateBudgetRequest = Request<
  UpdateBudgetParams,
  unknown,
  UpdateBudgetBody,
  EmptyObject
>;
type DeleteBudgetRequest = Request<DeleteBudgetParams>;

class BudgetsController {
  list = async (req: ListBudgetsRequest, res: Response, next: NextFunction) => {
    try {
      const budgets = await budgetsService.list(req.user!.id, req.query);

      return res.status(200).json({
        data: budgets,
        count: budgets.length,
      });
    } catch (error) {
      return next(error);
    }
  };

  create = async (
    req: CreateBudgetRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const budget = await budgetsService.create(req.user!.id, req.body);

      return res.status(201).json({
        data: budget,
      });
    } catch (error) {
      return next(error);
    }
  };

  update = async (
    req: UpdateBudgetRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const budget = await budgetsService.update(
        req.params.id,
        req.user!.id,
        req.body
      );

      return res.status(200).json({
        data: budget,
      });
    } catch (error) {
      return next(error);
    }
  };

  remove = async (
    req: DeleteBudgetRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const budget = await budgetsService.remove(req.params.id, req.user!.id);

      return res.status(200).json({
        data: budget,
        message: 'Budget deleted successfully',
      });
    } catch (error) {
      return next(error);
    }
  };
}

const budgetsController = new BudgetsController();

export default budgetsController;
