import bcrypt from 'bcryptjs';

import prisma from '../libs/prisma';
import env from '../env';
import {
  AccountType,
  CategoryType,
  RecurrenceFrequency,
  RecurringTransactionStatus,
  TransactionType,
} from '../../generated/prisma/enums';
import { getLogger } from '../libs/logger';

const logger = getLogger('BootstrapDev');

const toUtcDate = (
  year: number,
  monthIndex: number,
  day: number,
  hour = 12,
  minute = 0
) => new Date(Date.UTC(year, monthIndex, day, hour, minute, 0));

const getBalanceDelta = (
  type: TransactionType,
  amount: number,
  direction: 'primary' | 'transfer'
) => {
  if (type === TransactionType.INCOME) {
    return direction === 'primary' ? amount : 0;
  }

  if (type === TransactionType.EXPENSE) {
    return direction === 'primary' ? -amount : 0;
  }

  return direction === 'primary' ? -amount : amount;
};

type SeedTransaction = {
  id: string;
  accountName: string;
  categoryName?: string;
  transferAccountName?: string;
  type: TransactionType;
  amount: number;
  description: string;
  notes?: string;
  externalReference?: string;
  transactionDate: Date;
};

type SeedRecurringTransaction = {
  id: string;
  accountName: string;
  categoryName?: string;
  transferAccountName?: string;
  type: TransactionType;
  amount: number;
  description: string;
  notes?: string;
  frequency: RecurrenceFrequency;
  dayOfMonth?: number;
  dayOfWeek?: number;
  startDate: Date;
  endDate?: Date;
  nextRunAt: Date;
  lastRunAt?: Date;
  status: RecurringTransactionStatus;
  externalReference?: string;
};

export async function bootstrapDevData() {
  if (env.NODE_ENV !== 'development' || !env.ENABLE_DEV_SEED) {
    return;
  }

  const passwordHash = await bcrypt.hash(
    env.DEV_SEED_USER_PASSWORD,
    env.BCRYPT_ROUNDS
  );

  const user = await prisma.user.upsert({
    where: { email: env.DEV_SEED_USER_EMAIL },
    update: {
      name: env.DEV_SEED_USER_NAME,
      passwordHash,
      currency: 'GHS',
    },
    create: {
      email: env.DEV_SEED_USER_EMAIL,
      name: env.DEV_SEED_USER_NAME,
      passwordHash,
      currency: 'GHS',
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
        type: AccountType.CHECKING,
        currency: 'GHS',
        color: '#176b6c',
        icon: 'Building2',
        openingBalance: 6200,
        currentBalance: 6200,
      },
      {
        name: 'Savings',
        type: AccountType.SAVINGS,
        currency: 'GHS',
        color: '#1d4ed8',
        icon: 'PiggyBank',
        openingBalance: 14500,
        currentBalance: 14500,
      },
      {
        name: 'Wedding',
        type: AccountType.SAVINGS,
        currency: 'GHS',
        color: '#be185d',
        icon: 'Heart',
        openingBalance: 3200,
        currentBalance: 3200,
      },
      {
        name: 'Mobile Money',
        type: AccountType.CASH,
        currency: 'GHS',
        color: '#15803d',
        icon: 'Smartphone',
        openingBalance: 900,
        currentBalance: 900,
      },
      {
        name: 'Subscription',
        type: AccountType.CASH,
        currency: 'GHS',
        color: '#7c3aed',
        icon: 'CreditCard',
        openingBalance: 200,
        currentBalance: 200,
      },
    ].map((account) =>
      prisma.account.upsert({
        where: {
          userId_name: {
            userId: user.id,
            name: account.name,
          },
        },
        update: {
          type: account.type,
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
          type: account.type,
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
        type: CategoryType.EXPENSE,
        color: '#b45309',
        icon: '🍽️',
      },
      {
        name: 'Shopping',
        type: CategoryType.EXPENSE,
        color: '#176b6c',
        icon: '🛍️',
      },
      {
        name: 'Housing',
        type: CategoryType.EXPENSE,
        color: '#9a3412',
        icon: '🏠',
      },
      {
        name: 'Transportation',
        type: CategoryType.EXPENSE,
        color: '#f59e0b',
        icon: '🚗',
      },
      {
        name: 'Vehicle',
        type: CategoryType.EXPENSE,
        color: '#475569',
        icon: '🔧',
      },
      {
        name: 'Life & Entertainment',
        type: CategoryType.EXPENSE,
        color: '#be185d',
        icon: '🎮',
      },
      {
        name: 'Communications, PC',
        type: CategoryType.EXPENSE,
        color: '#0f766e',
        icon: '💻',
      },
      {
        name: 'Financial Expenses',
        type: CategoryType.EXPENSE,
        color: '#7c3aed',
        icon: '📈',
      },
      {
        name: 'Investments',
        type: CategoryType.EXPENSE,
        color: '#1d4ed8',
        icon: '📊',
      },
      {
        name: 'Income',
        type: CategoryType.INCOME,
        color: '#15803d',
        icon: '💰',
      },
      {
        name: 'Archived Legacy',
        type: CategoryType.EXPENSE,
        color: '#64748b',
        icon: '📁',
        isArchived: true,
      },
    ].map((category) =>
      prisma.category.upsert({
        where: {
          userId_type_name: {
            userId: user.id,
            type: category.type,
            name: category.name,
          },
        },
        update: {
          color: category.color,
          icon: category.icon,
          isSystem: category.name !== 'Archived Legacy',
          isArchived: category.isArchived ?? false,
        },
        create: {
          userId: user.id,
          name: category.name,
          type: category.type,
          color: category.color,
          icon: category.icon,
          isSystem: category.name !== 'Archived Legacy',
          isArchived: category.isArchived ?? false,
        },
      })
    )
  );

  const categoryMap = new Map(
    categories.map((category) => [category.name, category])
  );

  await Promise.all(
    [
      {
        categoryName: 'Food & Drinks',
        amount: 1200,
        notes: 'Meals, market runs, and quick coffee stops',
      },
      {
        categoryName: 'Shopping',
        amount: 900,
        notes: 'Household and personal purchases',
      },
      {
        categoryName: 'Housing',
        amount: 2200,
        notes: 'Rent and shared housing costs',
      },
      {
        categoryName: 'Transportation',
        amount: 450,
        notes: 'Fuel, ride hailing, and trotro fares',
      },
      {
        categoryName: 'Communications, PC',
        amount: 240,
        notes: 'Data bundles, internet, and device services',
      },
      {
        categoryName: 'Financial Expenses',
        amount: 180,
        notes: 'Bank charges and transfer fees',
      },
    ].map((budget) => {
      const category = categoryMap.get(budget.categoryName);

      if (!category) {
        throw new Error(`Missing seed category: ${budget.categoryName}`);
      }

      return prisma.budget.upsert({
        where: {
          userId_categoryId_month_year: {
            userId: user.id,
            categoryId: category.id,
            month: currentMonth,
            year: currentYear,
          },
        },
        update: {
          amount: budget.amount,
          notes: budget.notes,
        },
        create: {
          userId: user.id,
          categoryId: category.id,
          amount: budget.amount,
          month: currentMonth,
          year: currentYear,
          notes: budget.notes,
        },
      });
    })
  );

  const seededTransactions: SeedTransaction[] = [
    {
      id: `seed-income-${currentYear}-${currentMonth}`,
      accountName: 'Bank',
      categoryName: 'Income',
      type: TransactionType.INCOME,
      amount: 4800,
      description: 'Monthly salary deposit',
      transactionDate: monthDate(0, 1, 8),
    },
    {
      id: `seed-mobile-income-${currentYear}-${currentMonth}`,
      accountName: 'Mobile Money',
      categoryName: 'Income',
      type: TransactionType.INCOME,
      amount: 420,
      description: 'Side gig payment',
      transactionDate: monthDate(0, 3, 18, 45),
    },
    {
      id: `seed-housing-${currentYear}-${currentMonth}`,
      accountName: 'Bank',
      categoryName: 'Housing',
      type: TransactionType.EXPENSE,
      amount: 2200,
      description: 'Rent payment',
      transactionDate: monthDate(0, 2, 9, 10),
    },
    {
      id: `seed-food-${currentYear}-${currentMonth}`,
      accountName: 'Mobile Money',
      categoryName: 'Food & Drinks',
      type: TransactionType.EXPENSE,
      amount: 94.5,
      description: 'Lunch and groceries',
      transactionDate: monthDate(0, 5, 13, 15),
    },
    {
      id: `seed-shopping-${currentYear}-${currentMonth}`,
      accountName: 'Bank',
      categoryName: 'Shopping',
      type: TransactionType.EXPENSE,
      amount: 260,
      description: 'Home essentials',
      transactionDate: monthDate(0, 7, 16, 25),
    },
    {
      id: `seed-data-${currentYear}-${currentMonth}`,
      accountName: 'Subscription',
      categoryName: 'Communications, PC',
      type: TransactionType.EXPENSE,
      amount: 85,
      description: 'Internet renewal',
      transactionDate: monthDate(0, 8, 6, 5),
    },
    {
      id: `seed-streaming-${currentYear}-${currentMonth}`,
      accountName: 'Subscription',
      categoryName: 'Life & Entertainment',
      type: TransactionType.EXPENSE,
      amount: 39,
      description: 'Streaming subscription',
      transactionDate: monthDate(0, 10, 6, 15),
    },
    {
      id: `seed-save-${currentYear}-${currentMonth}`,
      accountName: 'Bank',
      transferAccountName: 'Savings',
      type: TransactionType.TRANSFER,
      amount: 600,
      description: 'Monthly savings transfer',
      transactionDate: monthDate(0, 9, 8, 30),
    },
    {
      id: `seed-wedding-${currentYear}-${currentMonth}`,
      accountName: 'Bank',
      transferAccountName: 'Wedding',
      type: TransactionType.TRANSFER,

      amount: 450,
      description: 'Wedding fund contribution',
      transactionDate: monthDate(0, 12, 10, 20),
    },
    {
      id: `seed-momo-topup-${currentYear}-${currentMonth}`,
      accountName: 'Bank',
      transferAccountName: 'Mobile Money',
      type: TransactionType.TRANSFER,
      amount: 300,
      description: 'Mobile money top-up',
      transactionDate: monthDate(0, 14, 11, 0),
    },
    {
      id: `seed-transport-${currentYear}-${currentMonth}`,
      accountName: 'Mobile Money',
      categoryName: 'Transportation',
      type: TransactionType.EXPENSE,
      amount: 58,
      description: 'Ride hailing and fuel',
      transactionDate: monthDate(0, 15, 17, 40),
    },
    {
      id: `seed-fees-${currentYear}-${currentMonth}`,
      accountName: 'Bank',
      categoryName: 'Financial Expenses',
      type: TransactionType.EXPENSE,
      amount: 22,
      description: 'Bank charges',
      transactionDate: monthDate(0, 16, 7, 0),
    },
    {
      id: `seed-investment-${currentYear}-${currentMonth}`,
      accountName: 'Bank',
      categoryName: 'Investments',
      type: TransactionType.EXPENSE,
      amount: 175,
      description: 'Mutual fund contribution',
      transactionDate: monthDate(0, 18, 14, 15),
    },
    {
      id: `seed-prev-food-${currentYear}-${currentMonth}`,
      accountName: 'Mobile Money',
      categoryName: 'Food & Drinks',
      type: TransactionType.EXPENSE,
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

      return prisma.transaction.upsert({
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

  const accountsForBalanceSync = await prisma.account.findMany({
    where: {
      userId: user.id,
    },
    select: {
      id: true,
      openingBalance: true,
    },
  });

  const allUserTransactions = await prisma.transaction.findMany({
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
      prisma.account.update({
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

  const seededRecurringTransactions: SeedRecurringTransaction[] = [
    {
      id: 'seed-recurring-salary',
      accountName: 'Bank',
      categoryName: 'Income',
      type: TransactionType.INCOME,
      amount: 4800,
      description: 'Salary recurring deposit',
      frequency: RecurrenceFrequency.MONTHLY,
      dayOfMonth: 1,
      startDate: monthDate(-2, 1, 8),
      nextRunAt: toUtcDate(nextMonthYear, nextMonthIndex, 1, 8),
      status: RecurringTransactionStatus.ACTIVE,
      externalReference: 'recurring-salary-bank',
    },
    {
      id: 'seed-recurring-subscription',
      accountName: 'Subscription',
      categoryName: 'Life & Entertainment',
      type: TransactionType.EXPENSE,
      amount: 39,
      description: 'Streaming subscription renewal',
      frequency: RecurrenceFrequency.MONTHLY,
      dayOfMonth: 10,
      startDate: monthDate(-4, 10, 6),
      nextRunAt: toUtcDate(nextMonthYear, nextMonthIndex, 10, 6),
      status: RecurringTransactionStatus.ACTIVE,
    },
    {
      id: 'seed-recurring-savings',
      accountName: 'Bank',
      transferAccountName: 'Savings',
      type: TransactionType.TRANSFER,
      amount: 600,
      description: 'Automatic savings contribution',
      frequency: RecurrenceFrequency.MONTHLY,
      dayOfMonth: 9,
      startDate: monthDate(-3, 9, 8, 30),
      nextRunAt: toUtcDate(nextMonthYear, nextMonthIndex, 9, 8, 30),
      status: RecurringTransactionStatus.ACTIVE,
    },
    {
      id: 'seed-recurring-wedding',
      accountName: 'Bank',
      transferAccountName: 'Wedding',
      type: TransactionType.TRANSFER,
      amount: 450,
      description: 'Wedding fund top-up',
      frequency: RecurrenceFrequency.MONTHLY,
      dayOfMonth: 12,
      startDate: monthDate(-3, 12, 10, 20),
      nextRunAt: toUtcDate(nextMonthYear, nextMonthIndex, 12, 10, 20),
      status: RecurringTransactionStatus.PAUSED,
    },
  ];

  await Promise.all(
    seededRecurringTransactions.map((recurringTransaction) => {
      const account = accountMap.get(recurringTransaction.accountName);
      const transferAccount = recurringTransaction.transferAccountName
        ? accountMap.get(recurringTransaction.transferAccountName)
        : null;
      const category = recurringTransaction.categoryName
        ? categoryMap.get(recurringTransaction.categoryName)
        : null;

      if (!account) {
        throw new Error(
          `Missing seed account: ${recurringTransaction.accountName}`
        );
      }

      if (recurringTransaction.transferAccountName && !transferAccount) {
        throw new Error(
          `Missing seed transfer account: ${recurringTransaction.transferAccountName}`
        );
      }

      if (recurringTransaction.categoryName && !category) {
        throw new Error(
          `Missing seed category: ${recurringTransaction.categoryName}`
        );
      }

      return prisma.recurringTransaction.upsert({
        where: { id: recurringTransaction.id },
        update: {
          accountId: account.id,
          categoryId: category?.id,
          transferAccountId: transferAccount?.id,
          type: recurringTransaction.type,
          amount: recurringTransaction.amount,
          description: recurringTransaction.description,
          notes: recurringTransaction.notes,
          frequency: recurringTransaction.frequency,
          dayOfMonth: recurringTransaction.dayOfMonth,
          dayOfWeek: recurringTransaction.dayOfWeek,
          startDate: recurringTransaction.startDate,
          endDate: recurringTransaction.endDate,
          nextRunAt: recurringTransaction.nextRunAt,
          lastRunAt: recurringTransaction.lastRunAt,
          status: recurringTransaction.status,
          externalReference: recurringTransaction.externalReference,
        },
        create: {
          id: recurringTransaction.id,
          userId: user.id,
          accountId: account.id,
          categoryId: category?.id,
          transferAccountId: transferAccount?.id,
          type: recurringTransaction.type,
          amount: recurringTransaction.amount,
          description: recurringTransaction.description,
          notes: recurringTransaction.notes,
          frequency: recurringTransaction.frequency,
          dayOfMonth: recurringTransaction.dayOfMonth,
          dayOfWeek: recurringTransaction.dayOfWeek,
          startDate: recurringTransaction.startDate,
          endDate: recurringTransaction.endDate,
          nextRunAt: recurringTransaction.nextRunAt,
          lastRunAt: recurringTransaction.lastRunAt,
          status: recurringTransaction.status,
          externalReference: recurringTransaction.externalReference,
        },
      });
    })
  );

  logger.info('Development bootstrap data is ready', {
    userId: user.id,
    email: user.email,
  });
}
