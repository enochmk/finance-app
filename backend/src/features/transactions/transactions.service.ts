import createHttpError from 'http-errors';

import prisma from '../../libs/prisma';
import type {
  CreateTransactionInput,
  ListTransactionsInput,
  UpdateTransactionInput,
} from './transactions.schema';

class TransactionsService {
  async list(filters: ListTransactionsInput) {
    return prisma.transaction.findMany({
      where: {
        userId: filters.userId,
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
  }

  async create(data: CreateTransactionInput) {
    return prisma.transaction.create({
      data: {
        userId: data.userId,
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
  }

  async update(id: string, data: UpdateTransactionInput) {
    await this.ensureOwnedTransaction(id, data.userId);

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
  }

  async remove(id: string, userId: string) {
    await this.ensureOwnedTransaction(id, userId);

    return prisma.transaction.delete({
      where: { id },
    });
  }

  private async ensureOwnedTransaction(id: string, userId: string) {
    const transaction = await prisma.transaction.findFirst({
      where: { id, userId },
      select: { id: true },
    });

    if (!transaction) {
      throw createHttpError(404, 'Transaction not found');
    }
  }
}

const transactionsService = new TransactionsService();

export default transactionsService;
