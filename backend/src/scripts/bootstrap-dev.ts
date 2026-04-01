import bcrypt from 'bcryptjs';

import { EntryType } from '../../generated/prisma/enums';
import prisma from '../libs/prisma';
import env from '../env';
import { getLogger } from '../libs/logger';
import { ensureCurrencies } from '../libs/currencies';

const logger = getLogger('BootstrapDev');

const toUtcDate = (
  year: number,
  monthIndex: number,
  day: number,
  hour = 12,
  minute = 0
) => new Date(Date.UTC(year, monthIndex, day, hour, minute, 0));

const getBalanceDelta = (
  type: EntryType,
  amount: number,
  direction: 'primary' | 'transfer'
) => {
  if (type === EntryType.INCOME) {
    return direction === 'primary' ? amount : 0;
  }

  if (type === EntryType.EXPENSE) {
    return direction === 'primary' ? -amount : 0;
  }

  return direction === 'primary' ? -amount : amount;
};

type SeedTransaction = {
  id: string;
  accountName: string;
  categoryName?: string;
  transferAccountName?: string;
  type: EntryType;
  amount: number;
  description: string;
  notes?: string;
  externalReference?: string;
  transactionDate: Date;
};

export async function bootstrapDevData() {
  if (env.NODE_ENV !== 'development' || !env.ENABLE_DEV_SEED) {
    return;
  }

  await ensureCurrencies();

  const ghsCurrency = await prisma.currencies.findUniqueOrThrow({
    where: { shortcode: 'GHS' },
  });

  const passwordHash = await bcrypt.hash(
    env.DEV_SEED_USER_PASSWORD,
    env.BCRYPT_ROUNDS
  );

  const user = await prisma.users.upsert({
    where: { email: env.DEV_SEED_USER_EMAIL },
    update: {
      name: env.DEV_SEED_USER_NAME,
      passwordHash,
      currency: ghsCurrency.shortcode,
    },
    create: {
      email: env.DEV_SEED_USER_EMAIL,
      name: env.DEV_SEED_USER_NAME,
      passwordHash,
      currency: ghsCurrency.shortcode,
    },
  });

  const now = new Date();
  const currentYear = now.getUTCFullYear();
  const currentMonthIndex = now.getUTCMonth();
  const currentMonth = currentMonthIndex + 1;

  const monthDate = (monthOffset: number, day: number, hour = 12, minute = 0) =>
    toUtcDate(currentYear, currentMonthIndex + monthOffset, day, hour, minute);

  const nextMonthDate = new Date(
    Date.UTC(currentYear, currentMonthIndex + 1, 1)
  );
  const nextMonthYear = nextMonthDate.getUTCFullYear();
  const nextMonthIndex = nextMonthDate.getUTCMonth();

  const accounts = await Promise.all(
    [
      {
        name: 'Bank',
        currency: ghsCurrency.shortcode,
        color: '#176b6c',
        icon: 'Building2',
        openingBalance: 6200,
        currentBalance: 6200,
      },
      {
        name: 'Savings',
        categoryName: 'Transfer',
        currency: ghsCurrency.shortcode,
        color: '#1d4ed8',
        icon: 'PiggyBank',
        openingBalance: 14500,
        currentBalance: 14500,
      },
      {
        name: 'Wedding',
        categoryName: 'Transfer',
        currency: ghsCurrency.shortcode,
        color: '#be185d',
        icon: 'Heart',
        openingBalance: 3200,
        currentBalance: 3200,
      },
      {
        name: 'Mobile Money',
        currency: ghsCurrency.shortcode,
        color: '#15803d',
        icon: 'Smartphone',
        openingBalance: 900,
        currentBalance: 900,
      },
      {
        name: 'Subscription',
        currency: ghsCurrency.shortcode,
        color: '#7c3aed',
        icon: 'CreditCard',
        openingBalance: 200,
        currentBalance: 200,
      },
    ].map((account) =>
      prisma.accounts.upsert({
        where: {
          userId_name: {
            userId: user.id,
            name: account.name,
          },
        },
        update: {
          currency: account.currency,
          color: account.color,
          icon: account.icon,
          openingBalance: account.openingBalance,
          currentBalance: account.currentBalance,
          isArchived: false,
          institutionName: null,
          accountNumberMasked: null,
        },
        create: {
          userId: user.id,
          name: account.name,
          currency: account.currency,
          color: account.color,
          icon: account.icon,
          openingBalance: account.openingBalance,
          currentBalance: account.currentBalance,
          isArchived: false,
        },
      })
    )
  );

  const accountMap = new Map(
    accounts.map((account) => [account.name, account])
  );

  const categories = await Promise.all(
    [
      {
        name: 'Food & Drinks',
        type: EntryType.EXPENSE,
        color: '#b45309',
        icon: '🍽️',
      },
      {
        name: 'Shopping',
        type: EntryType.EXPENSE,
        color: '#176b6c',
        icon: '🛍️',
      },
      {
        name: 'Housing',
        type: EntryType.EXPENSE,
        color: '#9a3412',
        icon: '🏠',
      },
      {
        name: 'Transportation',
        type: EntryType.EXPENSE,
        color: '#f59e0b',
        icon: '🚗',
      },
      {
        name: 'Vehicle',
        type: EntryType.EXPENSE,
        color: '#475569',
        icon: '🔧',
      },
      {
        name: 'Life & Entertainment',
        type: EntryType.EXPENSE,
        color: '#be185d',
        icon: '🎮',
      },
      {
        name: 'Communications, PC',
        type: EntryType.EXPENSE,
        color: '#0f766e',
        icon: '💻',
      },
      {
        name: 'Financial Expenses',
        type: EntryType.EXPENSE,
        color: '#7c3aed',
        icon: '📈',
      },
      {
        name: 'Investments',
        type: EntryType.EXPENSE,
        color: '#1d4ed8',
        icon: '📊',
      },
      {
        name: 'Income',
        type: EntryType.INCOME,
        color: '#15803d',
        icon: '💰',
      },
      {
        name: 'Transfer',
        type: EntryType.EXPENSE,
        color: '#0f766e',
        icon: '↔️',
      },
      {
        name: 'Unknown',
        type: EntryType.EXPENSE,
        color: '#dc2626',
        icon: '❓',
      },
      {
        name: 'Unknown',
        type: EntryType.INCOME,
        color: '#2563eb',
        icon: '❓',
      },
      {
        name: 'Archived Legacy',
        type: EntryType.EXPENSE,
        color: '#64748b',
        icon: '📁',
        isArchived: true,
      },
    ].map(async (category) => {
      const existing = await prisma.categories.findFirst({
        where: { userId: user.id, name: category.name, type: category.type },
      });
      if (existing) {
        return prisma.categories.update({
          where: { id: existing.id },
          data: {
            color: category.color,
            icon: category.icon,
            isSystem: category.name !== 'Archived Legacy',
            isArchived: category.isArchived ?? false,
          },
        });
      }
      return prisma.categories.create({
        data: {
          userId: user.id,
          name: category.name,
          type: category.type,
          color: category.color,
          icon: category.icon,
          isSystem: category.name !== 'Archived Legacy',
          isArchived: category.isArchived ?? false,
        },
      });
    })
  );

  const categoryMap = new Map(
    categories.map((category) => [category.name, category])
  );

  const seededTransactions: SeedTransaction[] = [
    {
      id: `seed-income-${currentYear}-${currentMonth}`,
      accountName: 'Bank',
      categoryName: 'Income',
      type: EntryType.INCOME,
      amount: 4800,
      description: 'Monthly salary deposit',
      transactionDate: monthDate(0, 1, 8),
    },
    {
      id: `seed-mobile-income-${currentYear}-${currentMonth}`,
      accountName: 'Mobile Money',
      categoryName: 'Income',
      type: EntryType.INCOME,
      amount: 420,
      description: 'Side gig payment',
      transactionDate: monthDate(0, 3, 18, 45),
    },
    {
      id: `seed-housing-${currentYear}-${currentMonth}`,
      accountName: 'Bank',
      categoryName: 'Housing',
      type: EntryType.EXPENSE,
      amount: 2200,
      description: 'Rent payment',
      transactionDate: monthDate(0, 2, 9, 10),
    },
    {
      id: `seed-food-${currentYear}-${currentMonth}`,
      accountName: 'Mobile Money',
      categoryName: 'Food & Drinks',
      type: EntryType.EXPENSE,
      amount: 94.5,
      description: 'Lunch and groceries',
      transactionDate: monthDate(0, 5, 13, 15),
    },
    {
      id: `seed-shopping-${currentYear}-${currentMonth}`,
      accountName: 'Bank',
      categoryName: 'Shopping',
      type: EntryType.EXPENSE,
      amount: 260,
      description: 'Home essentials',
      transactionDate: monthDate(0, 7, 16, 25),
    },
    {
      id: `seed-data-${currentYear}-${currentMonth}`,
      accountName: 'Subscription',
      categoryName: 'Communications, PC',
      type: EntryType.EXPENSE,
      amount: 85,
      description: 'Internet renewal',
      transactionDate: monthDate(0, 8, 6, 5),
    },
    {
      id: `seed-streaming-${currentYear}-${currentMonth}`,
      accountName: 'Subscription',
      categoryName: 'Life & Entertainment',
      type: EntryType.EXPENSE,
      amount: 39,
      description: 'Streaming subscription',
      transactionDate: monthDate(0, 10, 6, 15),
    },
    {
      id: `seed-save-${currentYear}-${currentMonth}`,
      accountName: 'Bank',
      transferAccountName: 'Savings',
      type: EntryType.TRANSFER,
      amount: 600,
      description: 'Monthly savings transfer',
      transactionDate: monthDate(0, 9, 8, 30),
    },
    {
      id: `seed-wedding-${currentYear}-${currentMonth}`,
      accountName: 'Bank',
      transferAccountName: 'Wedding',
      type: EntryType.TRANSFER,

      amount: 450,
      description: 'Wedding fund contribution',
      transactionDate: monthDate(0, 12, 10, 20),
    },
    {
      id: `seed-momo-topup-${currentYear}-${currentMonth}`,
      accountName: 'Bank',
      transferAccountName: 'Mobile Money',
      type: EntryType.TRANSFER,
      amount: 300,
      description: 'Mobile money top-up',
      transactionDate: monthDate(0, 14, 11, 0),
    },
    {
      id: `seed-transport-${currentYear}-${currentMonth}`,
      accountName: 'Mobile Money',
      categoryName: 'Transportation',
      type: EntryType.EXPENSE,
      amount: 58,
      description: 'Ride hailing and fuel',
      transactionDate: monthDate(0, 15, 17, 40),
    },
    {
      id: `seed-fees-${currentYear}-${currentMonth}`,
      accountName: 'Bank',
      categoryName: 'Financial Expenses',
      type: EntryType.EXPENSE,
      amount: 22,
      description: 'Bank charges',
      transactionDate: monthDate(0, 16, 7, 0),
    },
    {
      id: `seed-investment-${currentYear}-${currentMonth}`,
      accountName: 'Bank',
      categoryName: 'Investments',
      type: EntryType.EXPENSE,
      amount: 175,
      description: 'Mutual fund contribution',
      transactionDate: monthDate(0, 18, 14, 15),
    },
    {
      id: `seed-prev-food-${currentYear}-${currentMonth}`,
      accountName: 'Mobile Money',
      categoryName: 'Food & Drinks',
      type: EntryType.EXPENSE,
      amount: 67,
      description: 'Weekend takeaway',
      transactionDate: monthDate(-1, 27, 18, 20),
    },
  ];

  await Promise.all(
    seededTransactions.map((transaction) => {
      const account = accountMap.get(transaction.accountName);
      const transferAccount = transaction.transferAccountName
        ? accountMap.get(transaction.transferAccountName)
        : null;
      const category = transaction.categoryName
        ? categoryMap.get(transaction.categoryName)
        : null;

      if (!account) {
        throw new Error(`Missing seed account: ${transaction.accountName}`);
      }

      if (transaction.transferAccountName && !transferAccount) {
        throw new Error(
          `Missing seed transfer account: ${transaction.transferAccountName}`
        );
      }

      if (transaction.categoryName && !category) {
        throw new Error(`Missing seed category: ${transaction.categoryName}`);
      }

      return prisma.transactions.upsert({
        where: { id: transaction.id },
        update: {
          accountId: account.id,
          categoryId: category?.id,
          transferAccountId: transferAccount?.id,
          type: transaction.type,
          amount: transaction.amount,
          description: transaction.description,
          notes: transaction.notes,
          externalReference: transaction.externalReference,
          transactionDate: transaction.transactionDate,
        },
        create: {
          id: transaction.id,
          userId: user.id,
          accountId: account.id,
          categoryId: category?.id,
          transferAccountId: transferAccount?.id,
          type: transaction.type,
          amount: transaction.amount,
          description: transaction.description,
          notes: transaction.notes,
          externalReference: transaction.externalReference,
          transactionDate: transaction.transactionDate,
        },
      });
    })
  );

  const accountsForBalanceSync = await prisma.accounts.findMany({
    where: {
      userId: user.id,
    },
    select: {
      id: true,
      openingBalance: true,
    },
  });

  const allUserTransactions = await prisma.transactions.findMany({
    where: {
      userId: user.id,
    },
    select: {
      accountId: true,
      transferAccountId: true,
      type: true,
      amount: true,
    },
  });

  const recalculatedBalances = new Map(
    accountsForBalanceSync.map((account) => [
      account.id,
      Number(account.openingBalance),
    ])
  );

  for (const transaction of allUserTransactions) {
    const amount = Number(transaction.amount);
    const primaryBalance = recalculatedBalances.get(transaction.accountId) ?? 0;

    recalculatedBalances.set(
      transaction.accountId,
      primaryBalance + getBalanceDelta(transaction.type, amount, 'primary')
    );

    if (transaction.transferAccountId) {
      const transferBalance =
        recalculatedBalances.get(transaction.transferAccountId) ?? 0;

      recalculatedBalances.set(
        transaction.transferAccountId,
        transferBalance + getBalanceDelta(transaction.type, amount, 'transfer')
      );
    }
  }

  await Promise.all(
    accountsForBalanceSync.map((account) =>
      prisma.accounts.update({
        where: {
          id: account.id,
        },
        data: {
          currentBalance:
            recalculatedBalances.get(account.id) ??
            Number(account.openingBalance),
        },
      })
    )
  );

  logger.info('Development bootstrap data is ready', {
    userId: user.id,
    email: user.email,
  });
}
