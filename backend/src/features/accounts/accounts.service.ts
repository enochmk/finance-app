import createHttpError from 'http-errors';

import prisma from '../../libs/prisma';
import { ensureSystemCategory } from '../categories/system-categories';
import type {
  CreateAccountBody,
  ListAccountsQuery,
  UpdateAccountBody,
} from './accounts.schema';

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

class AccountsService {
  list = async (userId: string, filters: ListAccountsQuery) => {
    return prisma.account.findMany({
      where: {
        userId,
        type: filters.type,
        isArchived: filters.isArchived,
      },
      orderBy: [
        { isArchived: 'asc' },
        { position: 'asc' },
        { createdAt: 'desc' },
      ],
    });
  };

  reorder = async (userId: string, orderedIds: string[]) => {
    const accounts = await prisma.account.findMany({
      where: { userId },
      select: { id: true },
    });

    const ownedIds = new Set(accounts.map((a) => a.id));

    for (const id of orderedIds) {
      if (!ownedIds.has(id)) {
        throw createHttpError(403, 'Access denied to one or more accounts');
      }
    }

    await prisma.$transaction(
      orderedIds.map((id, index) =>
        prisma.account.update({
          where: { id },
          data: { position: index },
        })
      )
    );

    return prisma.account.findMany({
      where: { userId },
      orderBy: [
        { isArchived: 'asc' },
        { position: 'asc' },
        { createdAt: 'desc' },
      ],
    });
  };

  create = async (userId: string, data: CreateAccountBody) => {
    return prisma.account.create({
      data: {
        userId,
        name: data.name,
        type: data.type,
        currency: data.currency ?? 'GHS',
        color: data.color ?? '#176b6c',
        icon: data.icon,
        openingBalance: data.openingBalance ?? 0,
        currentBalance: data.currentBalance ?? data.openingBalance ?? 0,
        institutionName: data.institutionName,
        accountNumberMasked: data.accountNumberMasked,
        isArchived: data.isArchived ?? false,
      },
    });
  };

  update = async (id: string, userId: string, data: UpdateAccountBody) => {
    const existingAccount = await this.ensureOwnedAccount(id, userId);

    const nextOpeningBalance = data.openingBalance;
    const openingBalanceDelta =
      nextOpeningBalance !== undefined
        ? nextOpeningBalance - Number(existingAccount.openingBalance)
        : 0;
    const ledgerCurrentBalance =
      Number(existingAccount.currentBalance) + openingBalanceDelta;
    const hasExplicitCurrentBalanceTarget = data.currentBalance !== undefined;
    const balanceAdjustmentDelta = hasExplicitCurrentBalanceTarget
      ? Number(data.currentBalance) - ledgerCurrentBalance
      : 0;
    const adjustmentCategory =
      balanceAdjustmentDelta === 0
        ? null
        : await ensureSystemCategory(
            userId,
            balanceAdjustmentDelta > 0 ? 'UNKNOWN_INCOME' : 'UNKNOWN_EXPENSE'
          );

    return prisma.$transaction(async (tx) => {
      const account = await tx.account.update({
        where: { id },
        data: {
          name: data.name,
          type: data.type,
          currency: data.currency,
          color: data.color,
          icon: data.icon,
          openingBalance: data.openingBalance,
          currentBalance:
            data.currentBalance ??
            (nextOpeningBalance !== undefined
              ? ledgerCurrentBalance
              : undefined),
          institutionName: data.institutionName,
          accountNumberMasked: data.accountNumberMasked,
          isArchived: data.isArchived,
        },
      });

      if (adjustmentCategory && balanceAdjustmentDelta !== 0) {
        await tx.transaction.create({
          data: {
            userId,
            accountId: id,
            categoryId: adjustmentCategory.id,
            type: balanceAdjustmentDelta > 0 ? 'INCOME' : 'EXPENSE',
            amount: Math.abs(balanceAdjustmentDelta),
            description: `Balance adjustment for ${account.name}`,
            notes:
              'Auto-created to reconcile the stored account balance with the actual balance.',
            transactionDate: new Date(),
          },
        });
      }

      return account;
    });
  };

  remove = async (id: string, userId: string) => {
    await this.ensureOwnedAccount(id, userId);

    return prisma.$transaction(async (tx) => {
      await tx.recurringTransaction.deleteMany({
        where: {
          userId,
          OR: [{ accountId: id }, { transferAccountId: id }],
        },
      });

      await tx.transaction.deleteMany({
        where: {
          userId,
          OR: [{ accountId: id }, { transferAccountId: id }],
        },
      });

      const deletedAccount = await tx.account.delete({
        where: { id },
      });

      const remainingAccounts = await tx.account.findMany({
        where: { userId },
        select: {
          id: true,
          openingBalance: true,
        },
      });

      if (remainingAccounts.length > 0) {
        const balanceByAccountId = new Map(
          remainingAccounts.map((account) => [
            account.id,
            Number(account.openingBalance),
          ])
        );

        const remainingTransactions = await tx.transaction.findMany({
          where: { userId },
          select: {
            accountId: true,
            transferAccountId: true,
            type: true,
            amount: true,
          },
        });

        for (const transaction of remainingTransactions) {
          const amount = Number(transaction.amount);
          const primaryBalance = balanceByAccountId.get(transaction.accountId);

          if (primaryBalance !== undefined) {
            balanceByAccountId.set(
              transaction.accountId,
              primaryBalance +
                getBalanceDelta(transaction.type, amount, 'primary')
            );
          }

          if (!transaction.transferAccountId) {
            continue;
          }

          const transferBalance = balanceByAccountId.get(
            transaction.transferAccountId
          );

          if (transferBalance !== undefined) {
            balanceByAccountId.set(
              transaction.transferAccountId,
              transferBalance +
                getBalanceDelta(transaction.type, amount, 'transfer')
            );
          }
        }

        for (const account of remainingAccounts) {
          await tx.account.update({
            where: { id: account.id },
            data: {
              currentBalance:
                balanceByAccountId.get(account.id) ??
                Number(account.openingBalance),
            },
          });
        }
      }

      return deletedAccount;
    });
  };

  private ensureOwnedAccount = async (id: string, userId: string) => {
    const account = await prisma.account.findFirst({
      where: { id, userId },
      select: {
        id: true,
        name: true,
        openingBalance: true,
        currentBalance: true,
      },
    });

    if (!account) {
      throw createHttpError(404, 'Account not found');
    }

    return account;
  };
}

const accountsService = new AccountsService();

export default accountsService;
