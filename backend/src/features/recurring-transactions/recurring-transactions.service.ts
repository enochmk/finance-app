import createHttpError from 'http-errors';

import prisma from '../../libs/prisma';
import type {
  CreateRecurringTransactionBody,
  ListRecurringTransactionsQuery,
  RunRecurringTransactionsQuery,
  UpdateRecurringTransactionBody,
} from './recurring-transactions.schema';

type RecurringTransactionOwnershipData = {
  userId: string;
  accountId: string;
  categoryId?: string;
  type: CreateRecurringTransactionBody['type'];
  transferAccountId?: string;
  frequency: CreateRecurringTransactionBody['frequency'];
  dayOfMonth?: number;
  dayOfWeek?: number;
};

function clampDayOfMonth(year: number, monthIndex: number, dayOfMonth: number) {
  const lastDay = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
  return Math.min(dayOfMonth, lastDay);
}

function addDays(date: Date, amount: number) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + amount);
  return next;
}

function addMonths(date: Date, amount: number, dayOfMonth?: number) {
  const current = new Date(date);
  const targetMonthIndex = current.getUTCMonth() + amount;
  const year = current.getUTCFullYear() + Math.floor(targetMonthIndex / 12);
  const monthIndex = ((targetMonthIndex % 12) + 12) % 12;
  const day = clampDayOfMonth(year, monthIndex, dayOfMonth ?? current.getUTCDate());

  return new Date(
    Date.UTC(
      year,
      monthIndex,
      day,
      current.getUTCHours(),
      current.getUTCMinutes(),
      current.getUTCSeconds(),
      current.getUTCMilliseconds()
    )
  );
}

function computeNextRunDate(recurringTransaction: {
  frequency: 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
  intervalCount: number;
  nextRunAt: Date;
  dayOfMonth: number | null;
  dayOfWeek: number | null;
  endDate: Date | null;
}) {
  let nextRunAt = new Date(recurringTransaction.nextRunAt);

  if (recurringTransaction.frequency === 'WEEKLY') {
    nextRunAt = addDays(nextRunAt, 7 * recurringTransaction.intervalCount);

    if (recurringTransaction.dayOfWeek !== null) {
      const currentWeekday = nextRunAt.getUTCDay();
      const delta = (recurringTransaction.dayOfWeek - currentWeekday + 7) % 7;
      nextRunAt = addDays(nextRunAt, delta);
    }
  }

  if (recurringTransaction.frequency === 'MONTHLY') {
    nextRunAt = addMonths(
      nextRunAt,
      recurringTransaction.intervalCount,
      recurringTransaction.dayOfMonth ?? undefined
    );
  }

  if (recurringTransaction.frequency === 'QUARTERLY') {
    nextRunAt = addMonths(
      nextRunAt,
      recurringTransaction.intervalCount * 3,
      recurringTransaction.dayOfMonth ?? undefined
    );
  }

  if (recurringTransaction.frequency === 'YEARLY') {
    nextRunAt = addMonths(
      nextRunAt,
      recurringTransaction.intervalCount * 12,
      recurringTransaction.dayOfMonth ?? undefined
    );
  }

  if (recurringTransaction.endDate && nextRunAt > recurringTransaction.endDate) {
    return null;
  }

  return nextRunAt;
}

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

class RecurringTransactionsService {
  list = async (userId: string, filters: ListRecurringTransactionsQuery) => {
    return prisma.recurringTransaction.findMany({
      where: {
        userId,
        status: filters.status,
        frequency: filters.frequency,
      },
      include: {
        account: true,
        category: true,
        transferAccount: true,
      },
      orderBy: [{ nextRunAt: 'asc' }, { createdAt: 'desc' }],
    });
  };

  create = async (userId: string, data: CreateRecurringTransactionBody) => {
    const startDate = new Date(data.startDate);

    return prisma.recurringTransaction.create({
      data: {
        userId,
        accountId: data.accountId,
        categoryId: data.categoryId,
        transferAccountId: data.transferAccountId,
        type: data.type,
        amount: data.amount,
        description: data.description,
        notes: data.notes,
        frequency: data.frequency,
        intervalCount: data.intervalCount ?? 1,
        dayOfMonth: data.dayOfMonth,
        dayOfWeek: data.dayOfWeek,
        startDate,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
        nextRunAt: startDate,
        status: data.status ?? 'ACTIVE',
        externalReference: data.externalReference,
      },
      include: {
        account: true,
        category: true,
        transferAccount: true,
      },
    });
  };

  update = async (id: string, data: UpdateRecurringTransactionBody) => {
    return prisma.recurringTransaction.update({
      where: { id },
      data: {
        accountId: data.accountId,
        categoryId: data.categoryId,
        transferAccountId: data.transferAccountId,
        type: data.type,
        amount: data.amount,
        description: data.description,
        notes: data.notes,
        frequency: data.frequency,
        intervalCount: data.intervalCount,
        dayOfMonth: data.dayOfMonth,
        dayOfWeek: data.dayOfWeek,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
        status: data.status,
        externalReference: data.externalReference,
        ...(data.startDate
          ? {
              nextRunAt: new Date(data.startDate),
              lastRunAt: null,
            }
          : {}),
      },
      include: {
        account: true,
        category: true,
        transferAccount: true,
      },
    });
  };

  remove = async (id: string) => {
    return prisma.recurringTransaction.delete({
      where: { id },
    });
  };

  runDueTransactions = async (
    userId: string,
    filters: RunRecurringTransactionsQuery
  ) => {
    const upToDate = filters.upTo ? new Date(filters.upTo) : new Date();

    const dueItems = await prisma.recurringTransaction.findMany({
      where: {
        userId,
        status: 'ACTIVE',
        nextRunAt: {
          lte: upToDate,
        },
      },
      orderBy: [{ nextRunAt: 'asc' }],
    });

    const createdTransactionIds: string[] = [];

    for (const recurringTransaction of dueItems) {
      const createdTransaction = await prisma.$transaction(async (tx) => {
        const transaction = await tx.transaction.create({
          data: {
            userId,
            accountId: recurringTransaction.accountId,
            categoryId: recurringTransaction.categoryId,
            transferAccountId: recurringTransaction.transferAccountId,
            type: recurringTransaction.type,
            amount: recurringTransaction.amount,
            description: recurringTransaction.description,
            notes: recurringTransaction.notes,
            entryMode: 'AUTOMATED',
            transactionDate: recurringTransaction.nextRunAt,
            externalReference:
              recurringTransaction.externalReference ?? `recurring:${recurringTransaction.id}`,
          },
        });

        const amount = Number(recurringTransaction.amount);

        await tx.account.update({
          where: { id: recurringTransaction.accountId },
          data: {
            currentBalance: {
              increment: getBalanceDelta(recurringTransaction.type, amount, 'primary'),
            },
          },
        });

        if (recurringTransaction.type === 'TRANSFER' && recurringTransaction.transferAccountId) {
          await tx.account.update({
            where: { id: recurringTransaction.transferAccountId },
            data: {
              currentBalance: {
                increment: getBalanceDelta(recurringTransaction.type, amount, 'transfer'),
              },
            },
          });
        }

        return transaction;
      });

      createdTransactionIds.push(createdTransaction.id);

      const nextRunAt = computeNextRunDate(recurringTransaction);

      await prisma.recurringTransaction.update({
        where: { id: recurringTransaction.id },
        data: {
          lastRunAt: recurringTransaction.nextRunAt,
          nextRunAt: nextRunAt ?? recurringTransaction.nextRunAt,
          status: nextRunAt ? 'ACTIVE' : 'COMPLETED',
        },
      });
    }

    return {
      processedCount: dueItems.length,
      createdTransactionIds,
    };
  };

  validateOwnership = async (data: RecurringTransactionOwnershipData) => {
    await this.ensureOwnedAccount(data.accountId, data.userId, 'account');

    if (data.categoryId) {
      await this.ensureOwnedCategory(data.categoryId, data.userId);
    }

    if (data.type === 'TRANSFER') {
      if (!data.transferAccountId) {
        throw createHttpError(
          400,
          'transferAccountId is required for transfer recurring transactions'
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
        'transferAccountId can only be used with transfer recurring transactions'
      );
    }

    if (
      (data.frequency === 'MONTHLY' ||
        data.frequency === 'QUARTERLY' ||
        data.frequency === 'YEARLY') &&
      data.dayOfMonth === undefined
    ) {
      throw createHttpError(
        400,
        'dayOfMonth is required for monthly, quarterly, or yearly recurrence'
      );
    }

    if (data.frequency === 'WEEKLY' && data.dayOfWeek === undefined) {
      throw createHttpError(400, 'dayOfWeek is required for weekly recurrence');
    }
  };

  resolveUpdateOwnershipValidationData = async (
    id: string,
    userId: string,
    data: UpdateRecurringTransactionBody
  ): Promise<RecurringTransactionOwnershipData> => {
    const existingRecurringTransaction = await this.ensureOwnedRecurringTransaction(
      id,
      userId
    );

    return {
      userId,
      accountId: data.accountId ?? existingRecurringTransaction.accountId,
      categoryId:
        data.categoryId === undefined
          ? (existingRecurringTransaction.categoryId ?? undefined)
          : data.categoryId,
      type: data.type ?? existingRecurringTransaction.type,
      frequency: data.frequency ?? existingRecurringTransaction.frequency,
      transferAccountId:
        data.transferAccountId === undefined
          ? (existingRecurringTransaction.transferAccountId ?? undefined)
          : data.transferAccountId,
      dayOfMonth:
        data.dayOfMonth === undefined
          ? (existingRecurringTransaction.dayOfMonth ?? undefined)
          : data.dayOfMonth,
      dayOfWeek:
        data.dayOfWeek === undefined
          ? (existingRecurringTransaction.dayOfWeek ?? undefined)
          : data.dayOfWeek,
    };
  };

  ensureOwnedRecurringTransaction = async (id: string, userId: string) => {
    const recurringTransaction = await prisma.recurringTransaction.findFirst({
      where: { id, userId },
      select: {
        id: true,
        accountId: true,
        categoryId: true,
        type: true,
        transferAccountId: true,
        frequency: true,
        dayOfMonth: true,
        dayOfWeek: true,
      },
    });

    if (!recurringTransaction) {
      throw createHttpError(404, 'Recurring transaction not found');
    }

    return recurringTransaction;
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

const recurringTransactionsService = new RecurringTransactionsService();

export default recurringTransactionsService;
