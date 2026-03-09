import createHttpError from 'http-errors';

import prisma from '../../libs/prisma';
import type {
  CreateAccountInput,
  ListAccountsInput,
  UpdateAccountInput,
} from './accounts.schema';

class AccountsService {
  async list(userId: string, filters: ListAccountsInput) {
    return prisma.account.findMany({
      where: {
        userId,
        type: filters.type,
        isArchived: filters.isArchived,
      },
      orderBy: [{ isArchived: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async create(userId: string, data: CreateAccountInput) {
    return prisma.account.create({
      data: {
        userId,
        name: data.name,
        type: data.type,
        currency: data.currency ?? 'USD',
        openingBalance: data.openingBalance ?? 0,
        currentBalance: data.currentBalance ?? data.openingBalance ?? 0,
        institutionName: data.institutionName,
        accountNumberMasked: data.accountNumberMasked,
        isArchived: data.isArchived ?? false,
      },
    });
  }

  async update(id: string, userId: string, data: UpdateAccountInput) {
    await this.ensureOwnedAccount(id, userId);

    return prisma.account.update({
      where: { id },
      data: {
        name: data.name,
        type: data.type,
        currency: data.currency,
        openingBalance: data.openingBalance,
        currentBalance: data.currentBalance,
        institutionName: data.institutionName,
        accountNumberMasked: data.accountNumberMasked,
        isArchived: data.isArchived,
      },
    });
  }

  async remove(id: string, userId: string) {
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
  }

  private async ensureOwnedAccount(id: string, userId: string) {
    const account = await prisma.account.findFirst({
      where: { id, userId },
      select: { id: true },
    });

    if (!account) {
      throw createHttpError(404, 'Account not found');
    }
  }
}

const accountsService = new AccountsService();

export default accountsService;
