import createHttpError from 'http-errors';

import type { EntryType } from '../../libs/entry-type';
import prisma from '../../libs/prisma';
import { ensureSystemCategory } from '../categories/system-categories';
import type {
  CreateAccountBody,
  ListAccountsQuery,
  UpdateAccountBody,
} from './accounts.schema';

function getBalanceDelta(
  type: EntryType,
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
    return prisma.wallets.findMany({
      where: {
        userId,
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
    const accounts = await prisma.wallets.findMany({
      where: { userId },
      select: { id: true },
    });

    const ownedIds = new Set(accounts.map((a) => a.id));

    for (const id of orderedIds) {
      if (!ownedIds.has(id)) {
        throw createHttpError(403, 'Access denied to one or more wallets');
      }
    }

    await prisma.$transaction(
      orderedIds.map((id, index) =>
        prisma.wallets.update({
          where: { id },
          data: { position: index },
        })
      )
    );

    return prisma.wallets.findMany({
      where: { userId },
      orderBy: [
        { isArchived: 'asc' },
        { position: 'asc' },
        { createdAt: 'desc' },
      ],
    });
  };

  create = async (userId: string, data: CreateAccountBody) => {
    return prisma.wallets.create({
      data: {
        userId,
        name: data.name,
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
            balanceAdjustmentDelta > 0 ? 'UNKNOWN_INCOME' : 'UNKNOWN_EXPENSE'
          );

    return prisma.$transaction(async (tx) => {
      const account = await tx.wallets.update({
        where: { id },
        data: {
          name: data.name,
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
        await tx.transactions.create({
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
      await tx.transactions.deleteMany({
        where: {
          userId,
          OR: [{ accountId: id }, { transferAccountId: id }],
        },
      });

      const deletedAccount = await tx.wallets.delete({
        where: { id },
      });

      const remainingAccounts = await tx.wallets.findMany({
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

        const remainingTransactions = await tx.transactions.findMany({
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
          await tx.wallets.update({
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
    const account = await prisma.wallets.findFirst({
      where: { id, userId },
      select: {
        id: true,
        name: true,
        openingBalance: true,
        currentBalance: true,
      },
    });

    if (!account) {
      throw createHttpError(404, 'Wallet not found');
    }

    return account;
  };
}

const accountsService = new AccountsService();

export default accountsService;
