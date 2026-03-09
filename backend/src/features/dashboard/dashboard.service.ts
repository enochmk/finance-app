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

    const [accounts, budgets, recentTransactions, transactionGroups] =
      await Promise.all([
        prisma.account.findMany({
          where: {
            userId,
            isArchived: false,
          },
          orderBy: [{ createdAt: 'desc' }],
        }),
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
            transactionDate: {
              gte: periodStart,
              lt: periodEnd,
            },
          },
          _sum: {
            amount: true,
          },
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

    const totalBalance = accounts.reduce(
      (sum, account) => sum + toNumber(account.currentBalance),
      0
    );

    const totalBudgeted = budgets.reduce(
      (sum, budget) => sum + toNumber(budget.amount),
      0
    );

    const spendingByCategory = await prisma.transaction.groupBy({
      by: ['categoryId'],
      where: {
        userId,
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
    });

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
        currentBalance: toNumber(account.currentBalance),
        openingBalance: toNumber(account.openingBalance),
      })),
      budgets: budgetsWithUsage,
      recentTransactions,
    };
  };
}

const dashboardService = new DashboardService();

export default dashboardService;
