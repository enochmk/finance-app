import createHttpError from 'http-errors';

import prisma from '../../libs/prisma';
import {
  backfillTransferCategory,
  ensureSystemCategory,
} from '../categories/system-categories';
import type {
  CreateTransactionBody,
  ListTransactionsQuery,
  UpdateTransactionBody,
} from './transactions.schema';

export type TransactionOwnershipValidationData = {
  userId: string;
  accountId: string;
  categoryId?: string;
  type: CreateTransactionBody['type'];
  transferAccountId?: string;
  allowArchivedAccountIds?: string[];
};

function getBalanceDelta(
  type: 'INCOME' | 'EXPENSE' | 'TRANSFER',
  amount: number,
  direction: 'primary' | 'transfer'
) {
  if (type === 'INCOME') {
    return direction === 'primary' ? amount : 0;
  }

  if (type === 'EXPENSE') {
    return direction === 'primary' ? -amount : 0;
  }

  return direction === 'primary' ? -amount : amount;
}

class TransactionsService {
  list = async (userId: string, filters: ListTransactionsQuery) => {
    await backfillTransferCategory(userId);

    return prisma.transaction.findMany({
      where: {
        userId,
        accountId: filters.accountId,
        categoryId: filters.categoryId,
        type: filters.type,
        transactionDate:
          filters.from || filters.to
            ? {
                gte: filters.from ? new Date(filters.from) : undefined,
                lte: filters.to ? new Date(filters.to) : undefined,
              }
            : undefined,
      },
      include: {
        account: true,
        category: true,
        transferAccount: true,
      },
      orderBy: [{ transactionDate: 'desc' }, { createdAt: 'desc' }],
      take: filters.limit ?? 50,
    });
  };

  create = async (userId: string, data: CreateTransactionBody) => {
    const amount = Number(data.amount);
    const transferCategory =
      data.type === 'TRANSFER'
        ? await ensureSystemCategory(userId, 'TRANSFER')
        : null;

    return prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.create({
        data: {
          userId,
          accountId: data.accountId,
          categoryId:
            data.type === 'TRANSFER' ? transferCategory?.id : data.categoryId,
          type: data.type,
          amount: data.amount,
          description: data.description ?? '',
          notes: data.notes,
          transactionDate: new Date(data.transactionDate),
          transferAccountId: data.transferAccountId,
          externalReference: data.externalReference,
        },
      });

      await tx.account.update({
        where: { id: data.accountId },
        data: {
          currentBalance: {
            increment: getBalanceDelta(data.type, amount, 'primary'),
          },
        },
      });

      if (data.type === 'TRANSFER' && data.transferAccountId) {
        await tx.account.update({
          where: { id: data.transferAccountId },
          data: {
            currentBalance: {
              increment: getBalanceDelta(data.type, amount, 'transfer'),
            },
          },
        });
      }

      return tx.transaction.findUniqueOrThrow({
        where: { id: transaction.id },
        include: {
          account: true,
          category: true,
          transferAccount: true,
        },
      });
    });
  };

  update = async (id: string, userId: string, data: UpdateTransactionBody) => {
    const existingTransaction = await this.ensureOwnedTransaction(id, userId);
    const transferCategory =
      (data.type ?? existingTransaction.type) === 'TRANSFER'
        ? await ensureSystemCategory(userId, 'TRANSFER')
        : null;

    const nextAccountId = data.accountId ?? existingTransaction.accountId;
    const nextType = data.type ?? existingTransaction.type;
    const nextTransferAccountId =
      data.transferAccountId === undefined
        ? (existingTransaction.transferAccountId ?? undefined)
        : data.transferAccountId;
    const nextAmount = Number(data.amount ?? existingTransaction.amount);
    const previousAmount = Number(existingTransaction.amount);

    return prisma.$transaction(async (tx) => {
      const balanceAdjustments = new Map<string, number>();

      const applyAdjustment = (
        accountId: string | undefined,
        delta: number
      ) => {
        if (!accountId || delta === 0) {
          return;
        }

        balanceAdjustments.set(
          accountId,
          (balanceAdjustments.get(accountId) ?? 0) + delta
        );
      };

      applyAdjustment(
        existingTransaction.accountId,
        -getBalanceDelta(existingTransaction.type, previousAmount, 'primary')
      );
      applyAdjustment(
        existingTransaction.transferAccountId ?? undefined,
        -getBalanceDelta(existingTransaction.type, previousAmount, 'transfer')
      );
      applyAdjustment(
        nextAccountId,
        getBalanceDelta(nextType, nextAmount, 'primary')
      );
      applyAdjustment(
        nextTransferAccountId,
        getBalanceDelta(nextType, nextAmount, 'transfer')
      );

      for (const [accountId, delta] of balanceAdjustments.entries()) {
        if (delta !== 0) {
          await tx.account.update({
            where: { id: accountId },
            data: {
              currentBalance: {
                increment: delta,
              },
            },
          });
        }
      }

      await tx.transaction.update({
        where: { id },
        data: {
          accountId: data.accountId,
          categoryId:
            nextType === 'TRANSFER' ? transferCategory?.id : data.categoryId,
          type: data.type,
          amount: data.amount,
          description: data.description,
          notes: data.notes,
          transactionDate: data.transactionDate
            ? new Date(data.transactionDate)
            : undefined,
          transferAccountId: data.transferAccountId,
          externalReference: data.externalReference,
        },
      });

      return tx.transaction.findUniqueOrThrow({
        where: { id },
        include: {
          account: true,
          category: true,
          transferAccount: true,
        },
      });
    });
  };

  remove = async (id: string, userId: string) => {
    const existingTransaction = await this.ensureOwnedTransaction(id, userId);
    const amount = Number(existingTransaction.amount);

    return prisma.$transaction(async (tx) => {
      await tx.account.update({
        where: { id: existingTransaction.accountId },
        data: {
          currentBalance: {
            increment: -getBalanceDelta(
              existingTransaction.type,
              amount,
              'primary'
            ),
          },
        },
      });

      if (existingTransaction.transferAccountId) {
        await tx.account.update({
          where: { id: existingTransaction.transferAccountId },
          data: {
            currentBalance: {
              increment: -getBalanceDelta(
                existingTransaction.type,
                amount,
                'transfer'
              ),
            },
          },
        });
      }

      return tx.transaction.delete({
        where: { id },
      });
    });
  };

  validateOwnership = async (data: TransactionOwnershipValidationData) => {
    await this.ensureOwnedAccount(
      data.accountId,
      data.userId,
      'account',
      data.allowArchivedAccountIds?.includes(data.accountId) ?? false
    );

    if (data.categoryId) {
      await this.ensureOwnedCategory(data.categoryId, data.userId, data.type);
    }

    if (data.type === 'TRANSFER') {
      if (!data.transferAccountId) {
        throw createHttpError(
          400,
          'transferAccountId is required for transfer transactions'
        );
      }

      await this.ensureOwnedAccount(
        data.transferAccountId,
        data.userId,
        'transfer account',
        data.allowArchivedAccountIds?.includes(data.transferAccountId) ?? false
      );

      if (data.transferAccountId === data.accountId) {
        throw createHttpError(
          400,
          'transferAccountId must be different from accountId'
        );
      }
    }

    if (data.type !== 'TRANSFER' && data.transferAccountId) {
      throw createHttpError(
        400,
        'transferAccountId can only be used with transfer transactions'
      );
    }
  };

  resolveUpdateOwnershipValidationData = async (
    id: string,
    userId: string,
    data: UpdateTransactionBody
  ): Promise<TransactionOwnershipValidationData> => {
    const existingTransaction = await this.ensureOwnedTransaction(id, userId);

    return {
      userId,
      accountId: data.accountId ?? existingTransaction.accountId,
      categoryId:
        data.categoryId === undefined
          ? (existingTransaction.categoryId ?? undefined)
          : data.categoryId,
      type: data.type ?? existingTransaction.type,
      transferAccountId:
        data.transferAccountId === undefined
          ? (existingTransaction.transferAccountId ?? undefined)
          : data.transferAccountId,
      allowArchivedAccountIds: [
        existingTransaction.accountId,
        existingTransaction.transferAccountId,
      ].filter((value): value is string => Boolean(value)),
    };
  };

  ensureOwnedTransaction = async (id: string, userId: string) => {
    const transaction = await prisma.transaction.findFirst({
      where: { id, userId },
      select: {
        id: true,
        userId: true,
        accountId: true,
        categoryId: true,
        type: true,
        amount: true,
        description: true,
        notes: true,
        transactionDate: true,
        transferAccountId: true,
        externalReference: true,
      },
    });

    if (!transaction) {
      throw createHttpError(404, 'Transaction not found');
    }

    return transaction;
  };

  private ensureOwnedAccount = async (
    id: string,
    userId: string,
    label: 'account' | 'transfer account',
    allowArchived = false
  ) => {
    const account = await prisma.account.findFirst({
      where: { id, userId },
      select: { id: true, isArchived: true },
    });

    if (!account) {
      throw createHttpError(404, `${label} not found`);
    }

    if (account.isArchived && !allowArchived) {
      throw createHttpError(409, `${label} is disabled`);
    }
  };

  private ensureOwnedCategory = async (
    id: string,
    userId: string,
    transactionType?: 'INCOME' | 'EXPENSE' | 'TRANSFER'
  ) => {
    const category = await prisma.category.findFirst({
      where: { id, userId },
      select: { id: true, type: true },
    });

    if (!category) {
      throw createHttpError(404, 'Category not found');
    }

    if (transactionType && transactionType !== 'TRANSFER') {
      if (category.type !== transactionType) {
        throw createHttpError(
          422,
          `Category type '${category.type}' does not match transaction type '${transactionType}'`
        );
      }
    }
  };
}

const transactionsService = new TransactionsService();

export default transactionsService;
