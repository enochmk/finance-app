import type { NextFunction, Request, Response } from 'express';

import transactionsService from './transactions.service';
import type {
  CreateTransactionBody,
  DeleteTransactionParams,
  UpdateTransactionBody,
  UpdateTransactionParams,
} from './transactions.schema';

type EmptyObject = Record<string, never>;
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

export const validateCreateTransactionOwnership = async (
  req: CreateTransactionRequest,
  _res: Response,
  next: NextFunction
) => {
  try {
    await transactionsService.validateOwnership({
      ...req.body,
      userId: req.user!.id,
    });

    return next();
  } catch (error) {
    return next(error);
  }
};

export const validateUpdateTransactionOwnership = async (
  req: UpdateTransactionRequest,
  _res: Response,
  next: NextFunction
) => {
  try {
    // Merge missing patch fields with the stored transaction before validating ownership.
    const ownershipData =
      await transactionsService.resolveUpdateOwnershipValidationData(
        req.params.id,
        req.user!.id,
        req.body
      );

    await transactionsService.validateOwnership(ownershipData);

    return next();
  } catch (error) {
    return next(error);
  }
};

export const ensureOwnedTransactionAccess = async (
  req: DeleteTransactionRequest,
  _res: Response,
  next: NextFunction
) => {
  try {
    await transactionsService.ensureOwnedTransaction(
      req.params.id,
      req.user!.id
    );

    return next();
  } catch (error) {
    return next(error);
  }
};
