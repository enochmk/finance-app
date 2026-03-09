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
    },
    create: {
      email: env.DEV_SEED_USER_EMAIL,
      name: env.DEV_SEED_USER_NAME,
      passwordHash,
    },
  });

  const [mainChecking, cashWallet, creditCard] = await Promise.all([
    prisma.account.upsert({
      where: {
        userId_name: {
          userId: user.id,
          name: 'Main Checking',
        },
      },
      update: {
        type: AccountType.CHECKING,
        currentBalance: 2500,
      },
      create: {
        userId: user.id,
        name: 'Main Checking',
        type: AccountType.CHECKING,
        currency: 'USD',
        openingBalance: 2500,
        currentBalance: 2500,
      },
    }),
    prisma.account.upsert({
      where: {
        userId_name: {
          userId: user.id,
          name: 'Cash Wallet',
        },
      },
      update: {
        type: AccountType.CASH,
        currentBalance: 180,
      },
      create: {
        userId: user.id,
        name: 'Cash Wallet',
        type: AccountType.CASH,
        currency: 'USD',
        openingBalance: 180,
        currentBalance: 180,
      },
    }),
    prisma.account.upsert({
      where: {
        userId_name: {
          userId: user.id,
          name: 'Rewards Credit Card',
        },
      },
      update: {
        type: AccountType.CREDIT_CARD,
        currentBalance: -420,
      },
      create: {
        userId: user.id,
        name: 'Rewards Credit Card',
        type: AccountType.CREDIT_CARD,
        currency: 'USD',
        openingBalance: -420,
        currentBalance: -420,
      },
    }),
  ]);

  const [groceriesCategory, salaryCategory, rentCategory, transportCategory] =
    await Promise.all([
      prisma.category.upsert({
        where: {
          userId_type_name: {
            userId: user.id,
            type: CategoryType.EXPENSE,
            name: 'Groceries',
          },
        },
        update: {
          color: '#2F855A',
          icon: 'shopping-cart',
        },
        create: {
          userId: user.id,
          name: 'Groceries',
          type: CategoryType.EXPENSE,
          color: '#2F855A',
          icon: 'shopping-cart',
        },
      }),
      prisma.category.upsert({
        where: {
          userId_type_name: {
            userId: user.id,
            type: CategoryType.INCOME,
            name: 'Salary',
          },
        },
        update: {
          color: '#1F4F99',
          icon: 'briefcase',
        },
        create: {
          userId: user.id,
          name: 'Salary',
          type: CategoryType.INCOME,
          color: '#1F4F99',
          icon: 'briefcase',
        },
      }),
      prisma.category.upsert({
        where: {
          userId_type_name: {
            userId: user.id,
            type: CategoryType.EXPENSE,
            name: 'Rent',
          },
        },
        update: {
          color: '#8B5CF6',
          icon: 'building',
        },
        create: {
          userId: user.id,
          name: 'Rent',
          type: CategoryType.EXPENSE,
          color: '#8B5CF6',
          icon: 'building',
        },
      }),
      prisma.category.upsert({
        where: {
          userId_type_name: {
            userId: user.id,
            type: CategoryType.EXPENSE,
            name: 'Transport',
          },
        },
        update: {
          color: '#F59E0B',
          icon: 'car',
        },
        create: {
          userId: user.id,
          name: 'Transport',
          type: CategoryType.EXPENSE,
          color: '#F59E0B',
          icon: 'car',
        },
      }),
    ]);

  const now = new Date();
  const currentMonth = now.getUTCMonth() + 1;
  const currentYear = now.getUTCFullYear();

  await Promise.all([
    prisma.budget.upsert({
      where: {
        userId_categoryId_month_year: {
          userId: user.id,
          categoryId: groceriesCategory.id,
          month: currentMonth,
          year: currentYear,
        },
      },
      update: {
        amount: 500,
      },
      create: {
        userId: user.id,
        categoryId: groceriesCategory.id,
        amount: 500,
        month: currentMonth,
        year: currentYear,
      },
    }),
    prisma.budget.upsert({
      where: {
        userId_categoryId_month_year: {
          userId: user.id,
          categoryId: rentCategory.id,
          month: currentMonth,
          year: currentYear,
        },
      },
      update: {
        amount: 1400,
      },
      create: {
        userId: user.id,
        categoryId: rentCategory.id,
        amount: 1400,
        month: currentMonth,
        year: currentYear,
      },
    }),
    prisma.budget.upsert({
      where: {
        userId_categoryId_month_year: {
          userId: user.id,
          categoryId: transportCategory.id,
          month: currentMonth,
          year: currentYear,
        },
      },
      update: {
        amount: 220,
      },
      create: {
        userId: user.id,
        categoryId: transportCategory.id,
        amount: 220,
        month: currentMonth,
        year: currentYear,
      },
    }),
  ]);

  const transactionDates = [
    new Date(Date.UTC(currentYear, currentMonth - 1, 1, 8, 0, 0)),
    new Date(Date.UTC(currentYear, currentMonth - 1, 3, 18, 15, 0)),
    new Date(Date.UTC(currentYear, currentMonth - 1, 5, 7, 45, 0)),
    new Date(Date.UTC(currentYear, currentMonth - 1, 9, 19, 10, 0)),
    new Date(Date.UTC(currentYear, currentMonth - 1, 12, 10, 0, 0)),
  ];

  await Promise.all([
    prisma.transaction.upsert({
      where: { id: `seed-salary-${currentYear}-${currentMonth}` },
      update: {
        amount: 4200,
        transactionDate: transactionDates[0],
      },
      create: {
        id: `seed-salary-${currentYear}-${currentMonth}`,
        userId: user.id,
        accountId: mainChecking.id,
        categoryId: salaryCategory.id,
        type: TransactionType.INCOME,
        amount: 4200,
        description: 'Monthly salary',
        transactionDate: transactionDates[0],
      },
    }),
    prisma.transaction.upsert({
      where: { id: `seed-rent-${currentYear}-${currentMonth}` },
      update: {
        amount: 1400,
        transactionDate: transactionDates[1],
      },
      create: {
        id: `seed-rent-${currentYear}-${currentMonth}`,
        userId: user.id,
        accountId: mainChecking.id,
        categoryId: rentCategory.id,
        type: TransactionType.EXPENSE,
        amount: 1400,
        description: 'Monthly rent payment',
        transactionDate: transactionDates[1],
      },
    }),
    prisma.transaction.upsert({
      where: { id: `seed-groceries-${currentYear}-${currentMonth}` },
      update: {
        amount: 128.42,
        transactionDate: transactionDates[2],
      },
      create: {
        id: `seed-groceries-${currentYear}-${currentMonth}`,
        userId: user.id,
        accountId: creditCard.id,
        categoryId: groceriesCategory.id,
        type: TransactionType.EXPENSE,
        amount: 128.42,
        description: 'Groceries at City Market',
        transactionDate: transactionDates[2],
      },
    }),
    prisma.transaction.upsert({
      where: { id: `seed-transport-${currentYear}-${currentMonth}` },
      update: {
        amount: 42.5,
        transactionDate: transactionDates[3],
      },
      create: {
        id: `seed-transport-${currentYear}-${currentMonth}`,
        userId: user.id,
        accountId: creditCard.id,
        categoryId: transportCategory.id,
        type: TransactionType.EXPENSE,
        amount: 42.5,
        description: 'Fuel and parking',
        transactionDate: transactionDates[3],
      },
    }),
    prisma.transaction.upsert({
      where: { id: `seed-cash-transfer-${currentYear}-${currentMonth}` },
      update: {
        amount: 100,
        transactionDate: transactionDates[4],
      },
      create: {
        id: `seed-cash-transfer-${currentYear}-${currentMonth}`,
        userId: user.id,
        accountId: mainChecking.id,
        transferAccountId: cashWallet.id,
        type: TransactionType.TRANSFER,
        amount: 100,
        description: 'ATM cash transfer',
        transactionDate: transactionDates[4],
      },
    }),
  ]);

  await Promise.all([
    prisma.recurringTransaction.upsert({
      where: { id: 'seed-recurring-salary' },
      update: {
        amount: 4200,
        nextRunAt: new Date(Date.UTC(currentYear, currentMonth, 1, 8, 0, 0)),
      },
      create: {
        id: 'seed-recurring-salary',
        userId: user.id,
        accountId: mainChecking.id,
        categoryId: salaryCategory.id,
        type: TransactionType.INCOME,
        amount: 4200,
        description: 'Salary recurring deposit',
        frequency: RecurrenceFrequency.MONTHLY,
        dayOfMonth: 1,
        startDate: new Date(Date.UTC(currentYear, currentMonth - 1, 1, 8, 0, 0)),
        nextRunAt: new Date(Date.UTC(currentYear, currentMonth, 1, 8, 0, 0)),
        status: RecurringTransactionStatus.ACTIVE,
      },
    }),
    prisma.recurringTransaction.upsert({
      where: { id: 'seed-recurring-rent' },
      update: {
        amount: 1400,
        nextRunAt: new Date(Date.UTC(currentYear, currentMonth, 3, 18, 0, 0)),
      },
      create: {
        id: 'seed-recurring-rent',
        userId: user.id,
        accountId: mainChecking.id,
        categoryId: rentCategory.id,
        type: TransactionType.EXPENSE,
        amount: 1400,
        description: 'Recurring rent payment',
        frequency: RecurrenceFrequency.MONTHLY,
        dayOfMonth: 3,
        startDate: new Date(Date.UTC(currentYear, currentMonth - 1, 3, 18, 0, 0)),
        nextRunAt: new Date(Date.UTC(currentYear, currentMonth, 3, 18, 0, 0)),
        status: RecurringTransactionStatus.ACTIVE,
      },
    }),
    prisma.recurringTransaction.upsert({
      where: { id: 'seed-recurring-groceries' },
      update: {
        amount: 90,
        nextRunAt: new Date(Date.UTC(currentYear, currentMonth - 1, now.getUTCDate() + 3, 9, 0, 0)),
      },
      create: {
        id: 'seed-recurring-groceries',
        userId: user.id,
        accountId: creditCard.id,
        categoryId: groceriesCategory.id,
        type: TransactionType.EXPENSE,
        amount: 90,
        description: 'Weekly grocery refill',
        frequency: RecurrenceFrequency.WEEKLY,
        dayOfWeek: 6,
        startDate: new Date(Date.UTC(currentYear, currentMonth - 1, 6, 9, 0, 0)),
        nextRunAt: new Date(Date.UTC(currentYear, currentMonth - 1, now.getUTCDate() + 3, 9, 0, 0)),
        status: RecurringTransactionStatus.ACTIVE,
      },
    }),
  ]);

  logger.info('Development bootstrap data is ready', {
    userId: user.id,
    email: user.email,
  });
}
