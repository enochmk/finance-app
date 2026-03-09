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

  const now = new Date();
  const currentYear = now.getUTCFullYear();
  const currentMonthIndex = now.getUTCMonth();
  const currentMonth = currentMonthIndex + 1;

  const monthDate = (monthOffset: number, day: number, hour = 12, minute = 0) =>
    toUtcDate(currentYear, currentMonthIndex + monthOffset, day, hour, minute);

  const nextMonthYear = new Date(
    Date.UTC(currentYear, currentMonthIndex + 1, 1)
  ).getUTCFullYear();
  const nextMonthIndex = new Date(
    Date.UTC(currentYear, currentMonthIndex + 1, 1)
  ).getUTCMonth();

  const accounts = await Promise.all(
    [
      {
        name: 'Main Checking',
        type: AccountType.CHECKING,
        openingBalance: 3840.65,
        currentBalance: 3840.65,
        institutionName: 'Northstar Bank',
        accountNumberMasked: '1842',
      },
      {
        name: 'Emergency Savings',
        type: AccountType.SAVINGS,
        openingBalance: 12000,
        currentBalance: 12000,
        institutionName: 'Northstar Bank',
        accountNumberMasked: '9901',
      },
      {
        name: 'Cash Wallet',
        type: AccountType.CASH,
        openingBalance: 95,
        currentBalance: 95,
      },
      {
        name: 'Rewards Credit Card',
        type: AccountType.CREDIT_CARD,
        openingBalance: -612.34,
        currentBalance: -612.34,
        institutionName: 'Summit Card',
        accountNumberMasked: '4491',
      },
      {
        name: 'Brokerage Portfolio',
        type: AccountType.INVESTMENT,
        openingBalance: 8450.75,
        currentBalance: 8450.75,
        institutionName: 'Atlas Investments',
        accountNumberMasked: '7714',
      },
      {
        name: 'Auto Loan',
        type: AccountType.LOAN,
        openingBalance: -5400,
        currentBalance: -5400,
        institutionName: 'Civic Auto Finance',
        accountNumberMasked: '2208',
      },
      {
        name: 'Old Travel Card',
        type: AccountType.CREDIT_CARD,
        openingBalance: 0,
        currentBalance: 0,
        institutionName: 'Summit Card',
        accountNumberMasked: '1190',
        isArchived: true,
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
          currency: 'USD',
          openingBalance: account.openingBalance,
          currentBalance: account.currentBalance,
          institutionName: account.institutionName,
          accountNumberMasked: account.accountNumberMasked,
          isArchived: account.isArchived ?? false,
        },
        create: {
          userId: user.id,
          name: account.name,
          type: account.type,
          currency: 'USD',
          openingBalance: account.openingBalance,
          currentBalance: account.currentBalance,
          institutionName: account.institutionName,
          accountNumberMasked: account.accountNumberMasked,
          isArchived: account.isArchived ?? false,
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
        name: 'Salary',
        type: CategoryType.INCOME,
        color: '#1F4F99',
        icon: 'briefcase',
      },
      {
        name: 'Freelance',
        type: CategoryType.INCOME,
        color: '#0F766E',
        icon: 'sparkles',
      },
      {
        name: 'Interest',
        type: CategoryType.INCOME,
        color: '#2563EB',
        icon: 'landmark',
      },
      {
        name: 'Rent',
        type: CategoryType.EXPENSE,
        color: '#9A3412',
        icon: 'building',
      },
      {
        name: 'Groceries',
        type: CategoryType.EXPENSE,
        color: '#2F855A',
        icon: 'shopping-cart',
      },
      {
        name: 'Transport',
        type: CategoryType.EXPENSE,
        color: '#F59E0B',
        icon: 'car',
      },
      {
        name: 'Dining',
        type: CategoryType.EXPENSE,
        color: '#C2410C',
        icon: 'utensils',
      },
      {
        name: 'Utilities',
        type: CategoryType.EXPENSE,
        color: '#0F766E',
        icon: 'bolt',
      },
      {
        name: 'Subscriptions',
        type: CategoryType.EXPENSE,
        color: '#7C3AED',
        icon: 'tv',
      },
      {
        name: 'Entertainment',
        type: CategoryType.EXPENSE,
        color: '#BE185D',
        icon: 'music',
      },
      {
        name: 'Healthcare',
        type: CategoryType.EXPENSE,
        color: '#DC2626',
        icon: 'heart-pulse',
      },
      {
        name: 'Travel',
        type: CategoryType.EXPENSE,
        color: '#0369A1',
        icon: 'plane',
      },
      {
        name: 'Office Supplies',
        type: CategoryType.EXPENSE,
        color: '#6B7280',
        icon: 'package',
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
          isArchived: category.isArchived ?? false,
        },
        create: {
          userId: user.id,
          name: category.name,
          type: category.type,
          color: category.color,
          icon: category.icon,
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
        categoryName: 'Rent',
        amount: 1450,
        notes: 'Includes parking stall and renter insurance',
      },
      {
        categoryName: 'Groceries',
        amount: 520,
        notes: 'Targets pantry restocks and weekly produce runs',
      },
      {
        categoryName: 'Transport',
        amount: 260,
        notes: 'Fuel, transit reloads, and weekend parking',
      },
      {
        categoryName: 'Dining',
        amount: 180,
        notes: 'Mostly lunches and one Friday dinner out',
      },
      {
        categoryName: 'Utilities',
        amount: 240,
        notes: 'Power, internet, and water',
      },
      {
        categoryName: 'Subscriptions',
        amount: 78,
        notes: 'Streaming, cloud storage, and fitness app',
      },
      {
        categoryName: 'Entertainment',
        amount: 120,
        notes: 'Live events and weekend activities',
      },
      {
        categoryName: 'Healthcare',
        amount: 150,
        notes: 'Prescriptions and primary care copays',
      },
      {
        categoryName: 'Travel',
        amount: 300,
        notes: 'Builds a small monthly trip fund',
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

  await Promise.all(
    [
      {
        id: `seed-salary-${currentYear}-${currentMonth}`,
        accountName: 'Main Checking',
        categoryName: 'Salary',
        type: TransactionType.INCOME,
        amount: 4200,
        description: 'Monthly salary',
        notes: 'Net pay after payroll deductions',
        externalReference: `payroll-${currentYear}-${String(currentMonth).padStart(2, '0')}`,
        transactionDate: monthDate(0, 1, 8),
      },
      {
        id: `seed-rent-${currentYear}-${currentMonth}`,
        accountName: 'Main Checking',
        categoryName: 'Rent',
        type: TransactionType.EXPENSE,
        amount: 1450,
        description: 'Monthly rent payment',
        notes: 'Autopay to Parkview Towers',
        transactionDate: monthDate(0, 2, 18, 15),
      },
      {
        id: `seed-utilities-${currentYear}-${currentMonth}`,
        accountName: 'Main Checking',
        categoryName: 'Utilities',
        type: TransactionType.EXPENSE,
        amount: 184.63,
        description: 'Utilities bundle',
        notes: 'Internet and power paid together this cycle',
        transactionDate: monthDate(0, 4, 7, 30),
      },
      {
        id: `seed-groceries-${currentYear}-${currentMonth}`,
        accountName: 'Rewards Credit Card',
        categoryName: 'Groceries',
        type: TransactionType.EXPENSE,
        amount: 128.42,
        description: 'Groceries at City Market',
        notes: 'Weekly family grocery restock',
        externalReference: 'cc-city-market-12842',
        transactionDate: monthDate(0, 5, 19, 20),
      },
      {
        id: `seed-dining-${currentYear}-${currentMonth}`,
        accountName: 'Rewards Credit Card',
        categoryName: 'Dining',
        type: TransactionType.EXPENSE,
        amount: 46.8,
        description: 'Dinner at Ember Kitchen',
        transactionDate: monthDate(0, 6, 20, 10),
      },
      {
        id: `seed-savings-transfer-${currentYear}-${currentMonth}`,
        accountName: 'Main Checking',
        transferAccountName: 'Emergency Savings',
        type: TransactionType.TRANSFER,
        amount: 350,
        description: 'Automatic savings contribution',
        notes: 'Monthly emergency fund top-up',
        transactionDate: monthDate(0, 8, 9),
      },
      {
        id: `seed-freelance-${currentYear}-${currentMonth}`,
        accountName: 'Main Checking',
        categoryName: 'Freelance',
        type: TransactionType.INCOME,
        amount: 640,
        description: 'Freelance landing page project',
        externalReference: 'invoice-nimbus-204',
        transactionDate: monthDate(0, 10, 14, 45),
      },
      {
        id: `seed-investment-transfer-${currentYear}-${currentMonth}`,
        accountName: 'Main Checking',
        transferAccountName: 'Brokerage Portfolio',
        type: TransactionType.TRANSFER,
        amount: 275,
        description: 'Brokerage contribution',
        notes: 'Recurring taxable investment transfer',
        transactionDate: monthDate(0, 11, 8, 20),
      },
      {
        id: `seed-transport-${currentYear}-${currentMonth}`,
        accountName: 'Rewards Credit Card',
        categoryName: 'Transport',
        type: TransactionType.EXPENSE,
        amount: 42.5,
        description: 'Fuel and parking',
        transactionDate: monthDate(0, 13, 7, 50),
      },
      {
        id: `seed-subscriptions-${currentYear}-${currentMonth}`,
        accountName: 'Rewards Credit Card',
        categoryName: 'Subscriptions',
        type: TransactionType.EXPENSE,
        amount: 24.99,
        description: 'Streaming bundle renewal',
        externalReference: 'stream-bundle-monthly',
        transactionDate: monthDate(0, 15, 6),
      },
      {
        id: `seed-healthcare-${currentYear}-${currentMonth}`,
        accountName: 'Main Checking',
        categoryName: 'Healthcare',
        type: TransactionType.EXPENSE,
        amount: 85,
        description: 'Primary care copay',
        notes: 'Routine checkup visit',
        transactionDate: monthDate(0, 17, 11, 10),
      },
      {
        id: `seed-cash-transfer-${currentYear}-${currentMonth}`,
        accountName: 'Main Checking',
        transferAccountName: 'Cash Wallet',
        type: TransactionType.TRANSFER,
        amount: 120,
        description: 'ATM cash withdrawal',
        transactionDate: monthDate(0, 18, 10),
      },
      {
        id: `seed-entertainment-${currentYear}-${currentMonth}`,
        accountName: 'Cash Wallet',
        categoryName: 'Entertainment',
        type: TransactionType.EXPENSE,
        amount: 32,
        description: 'Indie cinema tickets',
        transactionDate: monthDate(0, 19, 21, 15),
      },
      {
        id: `seed-interest-${currentYear}-${currentMonth}`,
        accountName: 'Emergency Savings',
        categoryName: 'Interest',
        type: TransactionType.INCOME,
        amount: 18.14,
        description: 'Monthly savings interest',
        transactionDate: monthDate(0, 20, 7),
      },
      {
        id: `seed-travel-${currentYear}-${currentMonth}`,
        accountName: 'Rewards Credit Card',
        categoryName: 'Travel',
        type: TransactionType.EXPENSE,
        amount: 211.35,
        description: 'Regional train tickets',
        notes: 'Booked spring weekend trip',
        transactionDate: monthDate(0, 22, 16, 25),
      },
      {
        id: `seed-prev-groceries-${currentYear}-${currentMonth}`,
        accountName: 'Rewards Credit Card',
        categoryName: 'Groceries',
        type: TransactionType.EXPENSE,
        amount: 96.2,
        description: 'Late-month grocery restock',
        transactionDate: monthDate(-1, 26, 18, 40),
      },
      {
        id: `seed-prev-dining-${currentYear}-${currentMonth}`,
        accountName: 'Cash Wallet',
        categoryName: 'Dining',
        type: TransactionType.EXPENSE,
        amount: 14.5,
        description: 'Coffee and pastries',
        transactionDate: monthDate(-1, 27, 9, 5),
      },
      {
        id: `seed-prev-auto-loan-${currentYear}-${currentMonth}`,
        accountName: 'Main Checking',
        transferAccountName: 'Auto Loan',
        type: TransactionType.TRANSFER,
        amount: 320,
        description: 'Auto loan payment',
        notes: 'Principal and interest transfer',
        transactionDate: monthDate(-1, 28, 17, 25),
      },
    ].map((transaction) => {
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

  await Promise.all(
    [
      {
        id: 'seed-recurring-salary',
        accountName: 'Main Checking',
        categoryName: 'Salary',
        type: TransactionType.INCOME,
        amount: 4200,
        description: 'Salary recurring deposit',
        frequency: RecurrenceFrequency.MONTHLY,
        dayOfMonth: 1,
        startDate: monthDate(-2, 1, 8),
        nextRunAt: toUtcDate(nextMonthYear, nextMonthIndex, 1, 8),
        status: RecurringTransactionStatus.ACTIVE,
        externalReference: 'recurring-payroll-main',
      },
      {
        id: 'seed-recurring-rent',
        accountName: 'Main Checking',
        categoryName: 'Rent',
        type: TransactionType.EXPENSE,
        amount: 1450,
        description: 'Recurring rent payment',
        frequency: RecurrenceFrequency.MONTHLY,
        dayOfMonth: 2,
        startDate: monthDate(-2, 2, 18),
        nextRunAt: toUtcDate(nextMonthYear, nextMonthIndex, 2, 18),
        status: RecurringTransactionStatus.ACTIVE,
      },
      {
        id: 'seed-recurring-groceries',
        accountName: 'Rewards Credit Card',
        categoryName: 'Groceries',
        type: TransactionType.EXPENSE,
        amount: 92,
        description: 'Weekly grocery refill',
        frequency: RecurrenceFrequency.WEEKLY,
        dayOfWeek: 6,
        startDate: monthDate(-1, 6, 9),
        nextRunAt: new Date(
          Date.UTC(
            currentYear,
            currentMonthIndex,
            now.getUTCDate() + 3,
            9,
            0,
            0
          )
        ),
        status: RecurringTransactionStatus.ACTIVE,
      },
      {
        id: 'seed-recurring-brokerage-transfer',
        accountName: 'Main Checking',
        transferAccountName: 'Brokerage Portfolio',
        type: TransactionType.TRANSFER,
        amount: 275,
        description: 'Monthly brokerage transfer',
        notes: 'Long-term investing contribution',
        frequency: RecurrenceFrequency.MONTHLY,
        dayOfMonth: 11,
        startDate: monthDate(-3, 11, 8, 20),
        nextRunAt: toUtcDate(nextMonthYear, nextMonthIndex, 11, 8, 20),
        status: RecurringTransactionStatus.ACTIVE,
      },
      {
        id: 'seed-recurring-streaming',
        accountName: 'Rewards Credit Card',
        categoryName: 'Subscriptions',
        type: TransactionType.EXPENSE,
        amount: 24.99,
        description: 'Streaming bundle renewal',
        frequency: RecurrenceFrequency.MONTHLY,
        dayOfMonth: 15,
        startDate: monthDate(-4, 15, 6),
        nextRunAt: toUtcDate(nextMonthYear, nextMonthIndex, 15, 6),
        status: RecurringTransactionStatus.PAUSED,
        notes: 'Paused while comparing annual plans',
      },
      {
        id: 'seed-recurring-festival-fund',
        accountName: 'Main Checking',
        categoryName: 'Entertainment',
        type: TransactionType.EXPENSE,
        amount: 60,
        description: 'Festival savings envelope',
        frequency: RecurrenceFrequency.MONTHLY,
        dayOfMonth: 25,
        startDate: monthDate(-6, 25, 12),
        endDate: monthDate(-1, 25, 12),
        nextRunAt: monthDate(-1, 25, 12),
        lastRunAt: monthDate(-1, 25, 12),
        status: RecurringTransactionStatus.COMPLETED,
      },
    ].map((recurringTransaction) => {
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
