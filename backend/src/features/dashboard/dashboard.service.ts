import createHttpError from 'http-errors';

import prisma from '../../libs/prisma';
import { backfillTransferCategory } from '../categories/system-categories';

import type { GetDashboardSummaryQuery } from './dashboard.schema';

function getPeriodBounds(month?: number | string, year?: number | string) {
  const now = new Date();
  const selectedMonth = Number(month ?? now.getUTCMonth() + 1);
  const selectedYear = Number(year ?? now.getUTCFullYear());

  if (Number.isNaN(selectedMonth) || Number.isNaN(selectedYear)) {
    throw new Error(
      'Invalid period bounds: month and year must be numeric values'
    );
  }

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
    await backfillTransferCategory(userId);

    const { selectedMonth, selectedYear, periodStart, periodEnd } =
      getPeriodBounds(filters.month, filters.year);
    const recentLimit = filters.recentLimit ?? 10;

    const prevMonth = selectedMonth === 1 ? 12 : selectedMonth - 1;
    const prevYear = selectedMonth === 1 ? selectedYear - 1 : selectedYear;
    const previousPeriodStart = new Date(Date.UTC(prevYear, prevMonth - 1, 1));
    const previousPeriodEnd = new Date(Date.UTC(prevYear, prevMonth, 1));

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

    const [
      budgets,
      recentTransactions,
      transactionGroups,
      spendingByCategory,
      upcomingRecurringTransactions,
      incomeCategoryGroups,
      allPeriodTransactions,
      previousPeriodGroups,
      allCategories,
    ] = await Promise.all([
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
      // Income by category for the selected account in this period
      prisma.transaction.groupBy({
        by: ['categoryId'],
        where: {
          userId,
          accountId: selectedAccount.id,
          type: 'INCOME',
          categoryId: { not: null },
          transactionDate: { gte: periodStart, lt: periodEnd },
        },
        _sum: { amount: true },
      }),
      // All period transactions (lightweight) for cash flow and balance trend
      prisma.transaction.findMany({
        where: {
          userId,
          OR: [
            { accountId: selectedAccount.id },
            { transferAccountId: selectedAccount.id },
          ],
          transactionDate: { gte: periodStart, lt: periodEnd },
        },
        select: {
          type: true,
          amount: true,
          transactionDate: true,
          accountId: true,
          transferAccountId: true,
        },
        orderBy: [{ transactionDate: 'asc' }],
      }),
      // Previous period transaction totals by type
      prisma.transaction.groupBy({
        by: ['type'],
        where: {
          userId,
          OR: [
            { accountId: selectedAccount.id },
            { transferAccountId: selectedAccount.id },
          ],
          transactionDate: { gte: previousPeriodStart, lt: previousPeriodEnd },
        },
        _sum: { amount: true },
      }),
      // All categories for name/color resolution
      prisma.category.findMany({
        where: { userId },
        select: { id: true, name: true, type: true, color: true, icon: true },
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

    // Build category lookup map for expense/income breakdowns
    const categoryMap = new Map(
      allCategories.map((c) => [
        c.id,
        { id: c.id, name: c.name, type: c.type, color: c.color, icon: c.icon },
      ])
    );

    const expensesByCategory = spendingByCategory
      .map((item) => ({
        categoryId: item.categoryId,
        name: item.categoryId
          ? (categoryMap.get(item.categoryId)?.name ?? 'Uncategorized')
          : 'Uncategorized',
        amount: toNumber(item._sum.amount),
        color: item.categoryId
          ? (categoryMap.get(item.categoryId)?.color ?? null)
          : null,
        icon: item.categoryId
          ? (categoryMap.get(item.categoryId)?.icon ?? null)
          : null,
      }))
      .filter((item) => item.amount > 0)
      .sort((a, b) => b.amount - a.amount);

    const incomesByCategory = incomeCategoryGroups
      .map((item) => ({
        categoryId: item.categoryId,
        name: item.categoryId
          ? (categoryMap.get(item.categoryId)?.name ?? 'Uncategorized')
          : 'Uncategorized',
        amount: toNumber(item._sum.amount),
        color: item.categoryId
          ? (categoryMap.get(item.categoryId)?.color ?? null)
          : null,
        icon: item.categoryId
          ? (categoryMap.get(item.categoryId)?.icon ?? null)
          : null,
      }))
      .filter((item) => item.amount > 0)
      .sort((a, b) => b.amount - a.amount);

    // Compute daily cash flow and balance trend from all period transactions
    const dailyCashFlowMap = new Map<
      string,
      { income: number; expenses: number; net: number }
    >();

    for (const tx of allPeriodTransactions) {
      const dateKey = (tx.transactionDate as Date).toISOString().slice(0, 10);
      const existing = dailyCashFlowMap.get(dateKey) ?? {
        income: 0,
        expenses: 0,
        net: 0,
      };
      const amount = toNumber(tx.amount);

      if (tx.type === 'INCOME' && tx.accountId === selectedAccount.id) {
        existing.income += amount;
        existing.net += amount;
      } else if (tx.type === 'EXPENSE' && tx.accountId === selectedAccount.id) {
        existing.expenses += amount;
        existing.net -= amount;
      } else if (tx.type === 'TRANSFER') {
        if (tx.accountId === selectedAccount.id) {
          existing.net -= amount; // outgoing transfer
        } else {
          existing.net += amount; // incoming transfer
        }
      }

      dailyCashFlowMap.set(dateKey, existing);
    }

    const dailyCashFlow = [...dailyCashFlowMap.entries()]
      .map(([date, flow]) => ({
        date,
        income: Math.round(flow.income * 100) / 100,
        expenses: Math.round(flow.expenses * 100) / 100,
        net: Math.round(flow.net * 100) / 100,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Balance trend: compute running balance over the period
    const netPeriodChange = allPeriodTransactions.reduce((sum, tx) => {
      const amount = toNumber(tx.amount);
      if (tx.type === 'INCOME' && tx.accountId === selectedAccount.id)
        return sum + amount;
      if (tx.type === 'EXPENSE' && tx.accountId === selectedAccount.id)
        return sum - amount;
      if (tx.type === 'TRANSFER') {
        if (tx.accountId === selectedAccount.id) return sum - amount;
        return sum + amount;
      }
      return sum;
    }, 0);

    const periodStartBalance =
      toNumber(selectedAccount.currentBalance) - netPeriodChange;
    let runningBalance = periodStartBalance;

    const balanceTrend = dailyCashFlow.map((day) => {
      runningBalance += day.net;
      return {
        date: day.date,
        balance: Math.round(runningBalance * 100) / 100,
      };
    });

    // Previous period totals
    const previousTotals = previousPeriodGroups.reduce(
      (acc, group) => {
        acc[group.type] = toNumber(group._sum.amount);
        return acc;
      },
      { INCOME: 0, EXPENSE: 0, TRANSFER: 0 } as Record<string, number>
    );

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
        icon: selectedAccount.icon,
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
        icon: account.icon,
        currentBalance: toNumber(account.currentBalance),
        openingBalance: toNumber(account.openingBalance),
      })),
      budgets: budgetsWithUsage,
      expensesByCategory,
      incomesByCategory,
      dailyCashFlow,
      balanceTrend,
      previousPeriod: {
        month: prevMonth,
        year: prevYear,
        totalIncome: previousTotals.INCOME,
        totalExpenses: previousTotals.EXPENSE,
        totalTransfers: previousTotals.TRANSFER,
        netCashFlow: previousTotals.INCOME - previousTotals.EXPENSE,
      },
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
