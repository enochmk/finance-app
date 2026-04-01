import createHttpError from 'http-errors';

import prisma from '../../libs/prisma';
import { backfillTransferCategory } from '../categories/system-categories';

import type { GetDashboardSummaryQuery } from './dashboard.schema';

function toNumber(value: unknown) {
  return Number(value ?? 0);
}

type DashboardPreset = NonNullable<GetDashboardSummaryQuery['preset']>;
type DashboardCompareBy = NonNullable<GetDashboardSummaryQuery['compareBy']>;

type PeriodDefinition = {
  preset: DashboardPreset | 'customMonth';
  label: string;
  start: Date;
  end: Date;
  compareBy: DashboardCompareBy;
};

type LightweightTransaction = {
  type: string;
  amount: unknown;
  transactionDate: Date;
  accountId: string;
  transferAccountId: string | null;
};

const DAY_MS = 24 * 60 * 60 * 1000;

function startOfUtcDay(date: Date) {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
  );
}

function addDays(date: Date, days: number) {
  return new Date(date.getTime() + days * DAY_MS);
}

function daysBetween(start: Date, end: Date) {
  return Math.max(0, Math.round((end.getTime() - start.getTime()) / DAY_MS));
}

function getDefaultCompareBy(preset: DashboardPreset | 'customMonth') {
  if (preset === 'today') {
    return 'day';
  }

  if (preset === 'thisYear' || preset === 'lastYear') {
    return 'month';
  }

  return 'week';
}

function formatRangeLabel(start: Date, endExclusive: Date) {
  const end = addDays(endExclusive, -1);
  const startLabel = start.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
  const endLabel = end.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });

  if (start.getUTCFullYear() !== end.getUTCFullYear()) {
    return `${startLabel}, ${start.getUTCFullYear()} - ${endLabel}, ${end.getUTCFullYear()}`;
  }

  return `${startLabel} - ${endLabel}, ${start.getUTCFullYear()}`;
}

function resolvePeriod(filters: GetDashboardSummaryQuery): PeriodDefinition {
  const now = new Date();
  const todayStart = startOfUtcDay(now);
  const tomorrowStart = addDays(todayStart, 1);

  if (filters.preset) {
    switch (filters.preset) {
      case 'today':
        return {
          preset: filters.preset,
          label: 'Today',
          start: todayStart,
          end: tomorrowStart,
          compareBy: filters.compareBy ?? getDefaultCompareBy(filters.preset),
        };
      case 'last7days':
        return {
          preset: filters.preset,
          label: 'Last 7 days',
          start: addDays(tomorrowStart, -7),
          end: tomorrowStart,
          compareBy: filters.compareBy ?? getDefaultCompareBy(filters.preset),
        };
      case 'last30days':
        return {
          preset: filters.preset,
          label: 'Last 30 days',
          start: addDays(tomorrowStart, -30),
          end: tomorrowStart,
          compareBy: filters.compareBy ?? getDefaultCompareBy(filters.preset),
        };
      case 'thisMonth': {
        const start = new Date(
          Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)
        );

        return {
          preset: filters.preset,
          label: 'This month',
          start,
          end: tomorrowStart,
          compareBy: filters.compareBy ?? getDefaultCompareBy(filters.preset),
        };
      }
      case 'lastMonth': {
        const start = new Date(
          Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1)
        );
        const end = new Date(
          Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)
        );

        return {
          preset: filters.preset,
          label: 'Last month',
          start,
          end,
          compareBy: filters.compareBy ?? getDefaultCompareBy(filters.preset),
        };
      }
      case 'thisYear': {
        const start = new Date(Date.UTC(now.getUTCFullYear(), 0, 1));

        return {
          preset: filters.preset,
          label: 'This year',
          start,
          end: tomorrowStart,
          compareBy: filters.compareBy ?? getDefaultCompareBy(filters.preset),
        };
      }
      case 'lastYear': {
        const start = new Date(Date.UTC(now.getUTCFullYear() - 1, 0, 1));
        const end = new Date(Date.UTC(now.getUTCFullYear(), 0, 1));

        return {
          preset: filters.preset,
          label: 'Last year',
          start,
          end,
          compareBy: filters.compareBy ?? getDefaultCompareBy(filters.preset),
        };
      }
      default:
        break;
    }
  }

  const selectedMonth = Number(filters.month ?? now.getUTCMonth() + 1);
  const selectedYear = Number(filters.year ?? now.getUTCFullYear());

  if (Number.isNaN(selectedMonth) || Number.isNaN(selectedYear)) {
    throw new Error(
      'Invalid period bounds: month and year must be numeric values'
    );
  }

  const start = new Date(Date.UTC(selectedYear, selectedMonth - 1, 1));
  const end = new Date(Date.UTC(selectedYear, selectedMonth, 1));

  return {
    preset: 'customMonth',
    label: start.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    }),
    start,
    end,
    compareBy: filters.compareBy ?? getDefaultCompareBy('customMonth'),
  };
}

function getBucketStart(date: Date, compareBy: DashboardCompareBy) {
  if (compareBy === 'day') {
    return startOfUtcDay(date);
  }

  if (compareBy === 'week') {
    const day = date.getUTCDay();
    const diff = day === 0 ? -6 : 1 - day;
    return addDays(startOfUtcDay(date), diff);
  }

  if (compareBy === 'month') {
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
  }

  return new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
}

function addBucket(date: Date, compareBy: DashboardCompareBy) {
  if (compareBy === 'day') {
    return addDays(date, 1);
  }

  if (compareBy === 'week') {
    return addDays(date, 7);
  }

  if (compareBy === 'month') {
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1));
  }

  return new Date(Date.UTC(date.getUTCFullYear() + 1, 0, 1));
}

function formatBucketLabel(date: Date, compareBy: DashboardCompareBy) {
  if (compareBy === 'day') {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      timeZone: 'UTC',
    });
  }

  if (compareBy === 'week') {
    return `Week of ${date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      timeZone: 'UTC',
    })}`;
  }

  if (compareBy === 'month') {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      year: 'numeric',
      timeZone: 'UTC',
    });
  }

  return String(date.getUTCFullYear());
}

function getTransactionEffect(
  transaction: LightweightTransaction,
  accountId: string
) {
  const amount = toNumber(transaction.amount);

  if (transaction.type === 'INCOME' && transaction.accountId === accountId) {
    return amount;
  }

  if (transaction.type === 'EXPENSE' && transaction.accountId === accountId) {
    return -amount;
  }

  if (transaction.type === 'TRANSFER') {
    if (transaction.accountId === accountId) {
      return -amount;
    }

    if (transaction.transferAccountId === accountId) {
      return amount;
    }
  }

  return 0;
}

function sumNetEffect(
  transactions: LightweightTransaction[],
  accountId: string
) {
  return transactions.reduce(
    (sum, transaction) => sum + getTransactionEffect(transaction, accountId),
    0
  );
}

function calculatePercentChange(current: number, previous: number) {
  if (previous === 0) {
    if (current === 0) {
      return 0;
    }

    return null;
  }

  return ((current - previous) / Math.abs(previous)) * 100;
}

function buildTrendSeries(
  periodStart: Date,
  periodEnd: Date,
  compareBy: DashboardCompareBy,
  transactions: LightweightTransaction[],
  selectedAccountId: string,
  periodStartBalance: number
) {
  const buckets = new Map<
    string,
    {
      start: Date;
      label: string;
      income: number;
      expenses: number;
      net: number;
    }
  >();

  for (
    let cursor = getBucketStart(periodStart, compareBy);
    cursor < periodEnd;
    cursor = addBucket(cursor, compareBy)
  ) {
    buckets.set(cursor.toISOString(), {
      start: cursor,
      label: formatBucketLabel(cursor, compareBy),
      income: 0,
      expenses: 0,
      net: 0,
    });
  }

  for (const transaction of transactions) {
    const bucketStart = getBucketStart(transaction.transactionDate, compareBy);
    const bucket = buckets.get(bucketStart.toISOString());

    if (!bucket) {
      continue;
    }

    const amount = toNumber(transaction.amount);

    if (
      transaction.type === 'INCOME' &&
      transaction.accountId === selectedAccountId
    ) {
      bucket.income += amount;
      bucket.net += amount;
    } else if (
      transaction.type === 'EXPENSE' &&
      transaction.accountId === selectedAccountId
    ) {
      bucket.expenses += amount;
      bucket.net -= amount;
    } else if (transaction.type === 'TRANSFER') {
      if (transaction.accountId === selectedAccountId) {
        bucket.net -= amount;
      } else if (transaction.transferAccountId === selectedAccountId) {
        bucket.net += amount;
      }
    }
  }

  let runningBalance = periodStartBalance;

  const orderedBuckets = [...buckets.values()].sort(
    (left, right) => left.start.getTime() - right.start.getTime()
  );

  const cashFlowSeries = orderedBuckets.map((bucket) => ({
    date: bucket.start.toISOString().slice(0, 10),
    label: bucket.label,
    income: Math.round(bucket.income * 100) / 100,
    expenses: Math.round(bucket.expenses * 100) / 100,
    net: Math.round(bucket.net * 100) / 100,
  }));

  const balanceTrend = orderedBuckets.map((bucket) => {
    runningBalance += bucket.net;

    return {
      date: bucket.start.toISOString().slice(0, 10),
      label: bucket.label,
      balance: Math.round(runningBalance * 100) / 100,
    };
  });

  return {
    cashFlowSeries,
    balanceTrend,
  };
}

class DashboardService {
  getSummary = async (userId: string, filters: GetDashboardSummaryQuery) => {
    await backfillTransferCategory(userId);

    const period = resolvePeriod(filters);
    const recentLimit = filters.recentLimit ?? 10;
    const previousPeriodEnd = period.start;
    const previousPeriodStart = new Date(
      period.start.getTime() - (period.end.getTime() - period.start.getTime())
    );

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
          label: period.label,
          preset: period.preset,
          compareBy: period.compareBy,
          month: period.start.getUTCMonth() + 1,
          year: period.start.getUTCFullYear(),
          start: period.start.toISOString(),
          end: period.end.toISOString(),
        },
        selectedAccount: null,
        overview: {
          totalBalance: 0,
          totalIncome: 0,
          totalExpenses: 0,
          totalTransfers: 0,
          netCashFlow: 0,
        },
        accounts: [],
        recentTransactions: [],
        expensesByCategory: [],
        incomesByCategory: [],
        dailyCashFlow: [],
        balanceTrend: [],
        previousPeriod: {
          label: formatRangeLabel(previousPeriodStart, previousPeriodEnd),
          start: previousPeriodStart.toISOString(),
          end: previousPeriodEnd.toISOString(),
          month: previousPeriodStart.getUTCMonth() + 1,
          year: previousPeriodStart.getUTCFullYear(),
          totalIncome: 0,
          totalExpenses: 0,
          totalTransfers: 0,
          netCashFlow: 0,
          closingBalance: 0,
        },
        comparison: {
          totalBalance: { current: 0, previous: 0, change: 0, changePct: 0 },
          totalIncome: { current: 0, previous: 0, change: 0, changePct: 0 },
          totalExpenses: { current: 0, previous: 0, change: 0, changePct: 0 },
          netCashFlow: { current: 0, previous: 0, change: 0, changePct: 0 },
        },
      };
    }

    const selectedAccount =
      accounts.find((account) => account.id === filters.accountId) ??
      accounts[0];

    if (!selectedAccount) {
      throw createHttpError(404, 'Selected account not found');
    }

    const accountIds = accounts.map((account) => account.id);

    const [
      recentTransactions,
      transactionGroups,
      spendingByCategory,
      incomeCategoryGroups,
      currentPeriodTransactions,
      previousPeriodGroups,
      allCategories,
      futureTransactions,
    ] = await Promise.all([
      prisma.transaction.findMany({
        where: {
          userId,
          OR: [
            { accountId: selectedAccount.id },
            { transferAccountId: selectedAccount.id },
          ],
          transactionDate: {
            gte: period.start,
            lt: period.end,
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
            gte: period.start,
            lt: period.end,
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
            gte: period.start,
            lt: period.end,
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
          type: 'INCOME',
          categoryId: { not: null },
          transactionDate: {
            gte: period.start,
            lt: period.end,
          },
        },
        _sum: { amount: true },
      }),
      prisma.transaction.findMany({
        where: {
          userId,
          OR: [
            { accountId: selectedAccount.id },
            { transferAccountId: selectedAccount.id },
          ],
          transactionDate: {
            gte: period.start,
            lt: period.end,
          },
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
      prisma.transaction.groupBy({
        by: ['type'],
        where: {
          userId,
          OR: [
            { accountId: selectedAccount.id },
            { transferAccountId: selectedAccount.id },
          ],
          transactionDate: {
            gte: previousPeriodStart,
            lt: previousPeriodEnd,
          },
        },
        _sum: { amount: true },
      }),
      prisma.category.findMany({
        where: { userId },
        select: { id: true, name: true, type: true, color: true, icon: true },
      }),
      prisma.transaction.findMany({
        where: {
          userId,
          OR: [
            { accountId: { in: accountIds } },
            { transferAccountId: { in: accountIds } },
          ],
          transactionDate: {
            gte: period.end,
          },
        },
        select: {
          type: true,
          amount: true,
          transactionDate: true,
          accountId: true,
          transferAccountId: true,
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

    const futureNetByAccount = futureTransactions.reduce((acc, transaction) => {
      const affectedAccountIds = [
        transaction.accountId,
        ...(transaction.transferAccountId
          ? [transaction.transferAccountId]
          : []),
      ];

      for (const accountId of affectedAccountIds) {
        acc.set(
          accountId,
          (acc.get(accountId) ?? 0) +
            getTransactionEffect(transaction, accountId)
        );
      }

      return acc;
    }, new Map<string, number>());

    const accountBalancesAtPeriodEnd = new Map(
      accounts.map((account) => {
        const currentBalance = toNumber(account.currentBalance);
        const futureNet = futureNetByAccount.get(account.id) ?? 0;

        return [account.id, currentBalance - futureNet] as const;
      })
    );

    const totalBalance =
      accountBalancesAtPeriodEnd.get(selectedAccount.id) ?? 0;

    const spendingMap = new Map(
      spendingByCategory.map((item) => [
        item.categoryId,
        toNumber(item._sum.amount),
      ])
    );

    const categoryMap = new Map(
      allCategories.map((category) => [
        category.id,
        {
          id: category.id,
          name: category.name,
          type: category.type,
          color: category.color,
          icon: category.icon,
        },
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

    const currentPeriodNetChange = sumNetEffect(
      currentPeriodTransactions,
      selectedAccount.id
    );
    const selectedAccountClosingBalance =
      accountBalancesAtPeriodEnd.get(selectedAccount.id) ?? 0;
    const periodStartBalance =
      selectedAccountClosingBalance - currentPeriodNetChange;

    const { cashFlowSeries, balanceTrend } = buildTrendSeries(
      period.start,
      period.end,
      period.compareBy,
      currentPeriodTransactions,
      selectedAccount.id,
      periodStartBalance
    );

    const previousTotals = previousPeriodGroups.reduce(
      (acc, group) => {
        acc[group.type] = toNumber(group._sum.amount);
        return acc;
      },
      { INCOME: 0, EXPENSE: 0, TRANSFER: 0 } as Record<string, number>
    );

    const previousClosingBalance = periodStartBalance;

    return {
      period: {
        label: period.label,
        preset: period.preset,
        compareBy: period.compareBy,
        month: period.start.getUTCMonth() + 1,
        year: period.start.getUTCFullYear(),
        start: period.start.toISOString(),
        end: period.end.toISOString(),
      },
      selectedAccount: {
        id: selectedAccount.id,
        name: selectedAccount.name,
        type: selectedAccount.type,
        currency: selectedAccount.currency,
        color: selectedAccount.color,
        icon: selectedAccount.icon,
        currentBalance: selectedAccountClosingBalance,
        liveCurrentBalance: toNumber(selectedAccount.currentBalance),
        periodStartBalance,
        openingBalance: toNumber(selectedAccount.openingBalance),
      },
      overview: {
        totalBalance,
        totalIncome: totalsByType.INCOME,
        totalExpenses: totalsByType.EXPENSE,
        totalTransfers: totalsByType.TRANSFER,
        netCashFlow: totalsByType.INCOME - totalsByType.EXPENSE,
      },
      accounts: accounts.map((account) => ({
        id: account.id,
        name: account.name,
        type: account.type,
        currency: account.currency,
        color: account.color,
        icon: account.icon,
        currentBalance: accountBalancesAtPeriodEnd.get(account.id) ?? 0,
        liveCurrentBalance: toNumber(account.currentBalance),
        openingBalance: toNumber(account.openingBalance),
      })),
      recentTransactions,
      expensesByCategory,
      incomesByCategory,
      dailyCashFlow: cashFlowSeries,
      balanceTrend,
      previousPeriod: {
        label: formatRangeLabel(previousPeriodStart, previousPeriodEnd),
        start: previousPeriodStart.toISOString(),
        end: previousPeriodEnd.toISOString(),
        month: previousPeriodStart.getUTCMonth() + 1,
        year: previousPeriodStart.getUTCFullYear(),
        totalIncome: previousTotals.INCOME,
        totalExpenses: previousTotals.EXPENSE,
        totalTransfers: previousTotals.TRANSFER,
        netCashFlow: previousTotals.INCOME - previousTotals.EXPENSE,
        closingBalance: previousClosingBalance,
      },
      comparison: {
        totalBalance: {
          current: selectedAccountClosingBalance,
          previous: previousClosingBalance,
          change: selectedAccountClosingBalance - previousClosingBalance,
          changePct: calculatePercentChange(
            selectedAccountClosingBalance,
            previousClosingBalance
          ),
        },
        totalIncome: {
          current: totalsByType.INCOME,
          previous: previousTotals.INCOME,
          change: totalsByType.INCOME - previousTotals.INCOME,
          changePct: calculatePercentChange(
            totalsByType.INCOME,
            previousTotals.INCOME
          ),
        },
        totalExpenses: {
          current: totalsByType.EXPENSE,
          previous: previousTotals.EXPENSE,
          change: totalsByType.EXPENSE - previousTotals.EXPENSE,
          changePct: calculatePercentChange(
            totalsByType.EXPENSE,
            previousTotals.EXPENSE
          ),
        },
        netCashFlow: {
          current: totalsByType.INCOME - totalsByType.EXPENSE,
          previous: previousTotals.INCOME - previousTotals.EXPENSE,
          change:
            totalsByType.INCOME -
            totalsByType.EXPENSE -
            (previousTotals.INCOME - previousTotals.EXPENSE),
          changePct: calculatePercentChange(
            totalsByType.INCOME - totalsByType.EXPENSE,
            previousTotals.INCOME - previousTotals.EXPENSE
          ),
        },
      },
    };
  };
}

const dashboardService = new DashboardService();

export default dashboardService;
