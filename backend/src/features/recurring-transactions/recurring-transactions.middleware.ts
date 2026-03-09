import type { NextFunction, Request, Response } from 'express';

import recurringTransactionsService from './recurring-transactions.service';
import type {
  CreateRecurringTransactionBody,
  DeleteRecurringTransactionParams,
  UpdateRecurringTransactionBody,
  UpdateRecurringTransactionParams,
} from './recurring-transactions.schema';

type EmptyObject = Record<string, never>;
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
type DeleteRecurringTransactionRequest = Request<
  DeleteRecurringTransactionParams
>;

export const validateCreateRecurringTransactionOwnership = async (
  req: CreateRecurringTransactionRequest,
  _res: Response,
  next: NextFunction
) => {
  try {
    await recurringTransactionsService.validateOwnership({
      ...req.body,
      userId: req.user!.id,
    });

    return next();
  } catch (error) {
    return next(error);
  }
};

export const validateUpdateRecurringTransactionOwnership = async (
  req: UpdateRecurringTransactionRequest,
  _res: Response,
  next: NextFunction
) => {
  try {
    const ownershipData =
      await recurringTransactionsService.resolveUpdateOwnershipValidationData(
        req.params.id,
        req.user!.id,
        req.body
      );

    await recurringTransactionsService.validateOwnership(ownershipData);

    return next();
  } catch (error) {
    return next(error);
  }
};

export const ensureOwnedRecurringTransactionAccess = async (
  req: DeleteRecurringTransactionRequest,
  _res: Response,
  next: NextFunction
) => {
  try {
    await recurringTransactionsService.ensureOwnedRecurringTransaction(
      req.params.id,
      req.user!.id
    );

    return next();
  } catch (error) {
    return next(error);
  }
};
