import createHttpError from 'http-errors';

import prisma from '../../libs/prisma';
import type {
  CreateAccountBody,
  ListAccountsQuery,
  UpdateAccountBody,
} from './accounts.schema';

class AccountsService {
  list = async (userId: string, filters: ListAccountsQuery) => {
    return prisma.account.findMany({
      where: {
        userId,
        type: filters.type,
        isArchived: filters.isArchived,
      },
      orderBy: [{ isArchived: 'asc' }, { createdAt: 'desc' }],
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
        entryMode: data.entryMode ?? 'MANUAL',
        openingBalance: data.openingBalance ?? 0,
        currentBalance: data.currentBalance ?? data.openingBalance ?? 0,
        institutionName: data.institutionName,
        accountNumberMasked: data.accountNumberMasked,
        isArchived: data.isArchived ?? false,
      },
    });
  };

  update = async (id: string, userId: string, data: UpdateAccountBody) => {
    await this.ensureOwnedAccount(id, userId);

    return prisma.account.update({
      where: { id },
      data: {
        name: data.name,
        type: data.type,
        currency: data.currency,
        color: data.color,
        entryMode: data.entryMode,
        openingBalance: data.openingBalance,
        currentBalance: data.currentBalance,
        institutionName: data.institutionName,
        accountNumberMasked: data.accountNumberMasked,
        isArchived: data.isArchived,
      },
    });
  };

  remove = async (id: string, userId: string) => {
    await this.ensureOwnedAccount(id, userId);

    const transactionCount = await prisma.transaction.count({
      where: {
        userId,
        OR: [{ accountId: id }, { transferAccountId: id }],
      },
    });

    if (transactionCount > 0) {
      throw createHttpError(
        409,
        'Account cannot be deleted while transactions reference it'
      );
    }

    return prisma.account.delete({
      where: { id },
    });
  };

  private ensureOwnedAccount = async (id: string, userId: string) => {
    const account = await prisma.account.findFirst({
      where: { id, userId },
      select: { id: true },
    });

    if (!account) {
      throw createHttpError(404, 'Account not found');
    }
  };
}

const accountsService = new AccountsService();

export default accountsService;
