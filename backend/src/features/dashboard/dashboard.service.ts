import createHttpError from 'http-errors';

import prisma from '../../libs/prisma';

import type { GetDashboardSummaryQuery } from './dashboard.schema';

function getPeriodBounds(month?: number, year?: number) {
  const now = new Date();
  const selectedMonth = month ?? now.getUTCMonth() + 1;
  const selectedYear = year ?? now.getUTCFullYear();

  const periodStart = new Date(Date.UTC(selectedYear, selectedMonth - 1, 1));
  const periodEnd = new Date(Date.UTC(selectedYear, selectedMonth, 1));

  return {
    selectedMonth,
    selectedYear,
    periodStart,
    periodEnd,
  };
}

function toNumber(value: unknown) {
  return Number(value ?? 0);
}

class DashboardService {
  getSummary = async (userId: string, filters: GetDashboardSummaryQuery) => {
    const { selectedMonth, selectedYear, periodStart, periodEnd } =
      getPeriodBounds(filters.month, filters.year);
    const recentLimit = filters.recentLimit ?? 5;

    const accounts = await prisma.account.findMany({
      where: {
        userId,
        isArchived: false,
      },
      orderBy: [{ createdAt: 'desc' }],
    });

    if (accounts.length === 0) {
      return {
        period: {
          month: selectedMonth,
          year: selectedYear,
          start: periodStart.toISOString(),
          end: periodEnd.toISOString(),
        },
        selectedAccount: null,
        accounts: [],
        overview: {
          totalBalance: 0,
          totalIncome: 0,
          totalExpenses: 0,
          totalTransfers: 0,
          netCashFlow: 0,
          totalBudgeted: 0,
        },
        budgets: [],
        recurringTransactions: [],
        recentTransactions: [],
      };
    }

    const selectedAccount = filters.accountId
      ? accounts.find((account) => account.id === filters.accountId)
      : accounts[0];

    if (!selectedAccount) {
      throw createHttpError(404, 'Selected account not found');
    }

    const [budgets, recentTransactions, transactionGroups, spendingByCategory, upcomingRecurringTransactions] =
      await Promise.all([
        prisma.budget.findMany({
          where: {
            userId,
            month: selectedMonth,
            year: selectedYear,
          },
          include: {
            category: true,
          },
          orderBy: [{ createdAt: 'desc' }],
        }),
        prisma.transaction.findMany({
          where: {
            userId,
            OR: [
              { accountId: selectedAccount.id },
              { transferAccountId: selectedAccount.id },
            ],
            transactionDate: {
              gte: periodStart,
              lt: periodEnd,
            },
          },
          include: {
            account: true,
            category: true,
            transferAccount: true,
          },
          orderBy: [{ transactionDate: 'desc' }, { createdAt: 'desc' }],
          take: recentLimit,
        }),
        prisma.transaction.groupBy({
          by: ['type'],
          where: {
            userId,
            OR: [
              { accountId: selectedAccount.id },
              { transferAccountId: selectedAccount.id },
            ],
            transactionDate: {
              gte: periodStart,
              lt: periodEnd,
            },
          },
          _sum: {
            amount: true,
          },
        }),
        prisma.transaction.groupBy({
          by: ['categoryId'],
          where: {
            userId,
            accountId: selectedAccount.id,
            type: 'EXPENSE',
            categoryId: {
              not: null,
            },
            transactionDate: {
              gte: periodStart,
              lt: periodEnd,
            },
          },
          _sum: {
            amount: true,
          },
        }),
        prisma.recurringTransaction.findMany({
          where: {
            userId,
            status: 'ACTIVE',
            OR: [
              { accountId: selectedAccount.id },
              { transferAccountId: selectedAccount.id },
            ],
          },
          include: {
            account: true,
            category: true,
            transferAccount: true,
          },
          orderBy: [{ nextRunAt: 'asc' }],
          take: 5,
        }),
      ]);

    const totalsByType = transactionGroups.reduce(
      (acc, group) => {
        acc[group.type] = toNumber(group._sum.amount);
        return acc;
      },
      {
        INCOME: 0,
        EXPENSE: 0,
        TRANSFER: 0,
      } as Record<string, number>
    );

    const totalBalance = toNumber(selectedAccount.currentBalance);

    const totalBudgeted = budgets.reduce(
      (sum, budget) => sum + toNumber(budget.amount),
      0
    );

    const spendingMap = new Map(
      spendingByCategory.map((item) => [
        item.categoryId,
        toNumber(item._sum.amount),
      ])
    );

    const budgetsWithUsage = budgets.map((budget) => {
      const spent = spendingMap.get(budget.categoryId) ?? 0;
      const amount = toNumber(budget.amount);

      return {
        id: budget.id,
        month: budget.month,
        year: budget.year,
        amount,
        spent,
        remaining: amount - spent,
        utilizationRate: amount > 0 ? spent / amount : 0,
        category: {
          id: budget.category.id,
          name: budget.category.name,
          type: budget.category.type,
          color: budget.category.color,
          icon: budget.category.icon,
        },
      };
    });

    return {
      period: {
        month: selectedMonth,
        year: selectedYear,
        start: periodStart.toISOString(),
        end: periodEnd.toISOString(),
      },
      selectedAccount: {
        id: selectedAccount.id,
        name: selectedAccount.name,
        type: selectedAccount.type,
        currency: selectedAccount.currency,
        color: selectedAccount.color,
        entryMode: selectedAccount.entryMode,
        currentBalance: toNumber(selectedAccount.currentBalance),
        openingBalance: toNumber(selectedAccount.openingBalance),
      },
      overview: {
        totalBalance,
        totalIncome: totalsByType.INCOME,
        totalExpenses: totalsByType.EXPENSE,
        totalTransfers: totalsByType.TRANSFER,
        netCashFlow: totalsByType.INCOME - totalsByType.EXPENSE,
        totalBudgeted,
      },
      accounts: accounts.map((account) => ({
        id: account.id,
        name: account.name,
        type: account.type,
        currency: account.currency,
        color: account.color,
        entryMode: account.entryMode,
        currentBalance: toNumber(account.currentBalance),
        openingBalance: toNumber(account.openingBalance),
      })),
      budgets: budgetsWithUsage,
      recurringTransactions: upcomingRecurringTransactions.map(
        (recurringTransaction) => ({
          id: recurringTransaction.id,
          description: recurringTransaction.description,
          type: recurringTransaction.type,
          amount: toNumber(recurringTransaction.amount),
          frequency: recurringTransaction.frequency,
          nextRunAt: recurringTransaction.nextRunAt.toISOString(),
          status: recurringTransaction.status,
          account: {
            id: recurringTransaction.account.id,
            name: recurringTransaction.account.name,
            currency: recurringTransaction.account.currency,
          },
          transferAccount: recurringTransaction.transferAccount
            ? {
                id: recurringTransaction.transferAccount.id,
                name: recurringTransaction.transferAccount.name,
                currency: recurringTransaction.transferAccount.currency,
              }
            : null,
          category: recurringTransaction.category
            ? {
                id: recurringTransaction.category.id,
                name: recurringTransaction.category.name,
                type: recurringTransaction.category.type,
              }
            : null,
        })
      ),
      recentTransactions,
    };
  };
}

const dashboardService = new DashboardService();

export default dashboardService;
