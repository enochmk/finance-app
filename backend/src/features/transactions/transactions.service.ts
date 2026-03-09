import createHttpError from 'http-errors';

import prisma from '../../libs/prisma';
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
};

class TransactionsService {
  list = async (userId: string, filters: ListTransactionsQuery) => {
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
    return prisma.transaction.create({
      data: {
        userId,
        accountId: data.accountId,
        categoryId: data.categoryId,
        type: data.type,
        amount: data.amount,
        description: data.description,
        notes: data.notes,
        transactionDate: new Date(data.transactionDate),
        transferAccountId: data.transferAccountId,
        externalReference: data.externalReference,
      },
      include: {
        account: true,
        category: true,
        transferAccount: true,
      },
    });
  };

  update = async (id: string, data: UpdateTransactionBody) => {
    return prisma.transaction.update({
      where: { id },
      data: {
        accountId: data.accountId,
        categoryId: data.categoryId,
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
      include: {
        account: true,
        category: true,
        transferAccount: true,
      },
    });
  };

  remove = async (id: string) => {
    return prisma.transaction.delete({
      where: { id },
    });
  };

  validateOwnership = async (data: TransactionOwnershipValidationData) => {
    await this.ensureOwnedAccount(data.accountId, data.userId, 'account');

    if (data.categoryId) {
      await this.ensureOwnedCategory(data.categoryId, data.userId);
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
        'transfer account'
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
    label: 'account' | 'transfer account'
  ) => {
    const account = await prisma.account.findFirst({
      where: { id, userId },
      select: { id: true },
    });

    if (!account) {
      throw createHttpError(404, `${label} not found`);
    }
  };

  private ensureOwnedCategory = async (id: string, userId: string) => {
    const category = await prisma.category.findFirst({
      where: { id, userId },
      select: { id: true },
    });

    if (!category) {
      throw createHttpError(404, 'Category not found');
    }
  };
}

const transactionsService = new TransactionsService();

export default transactionsService;
