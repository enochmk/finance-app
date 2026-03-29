import prisma from '../../libs/prisma';

import type { GetMonthlyReportQuery } from './reports.schema';

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

class ReportsService {
  getMonthlyReport = async (userId: string, filters: GetMonthlyReportQuery) => {
    const { selectedMonth, selectedYear, periodStart, periodEnd } =
      getPeriodBounds(filters.month, filters.year);

    const [transactions, categories, accounts] = await Promise.all([
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
        orderBy: [{ transactionDate: 'asc' }, { createdAt: 'asc' }],
      }),
      prisma.category.findMany({
        where: {
          userId,
          isArchived: false,
        },
        orderBy: [{ type: 'asc' }, { name: 'asc' }],
      }),
      prisma.account.findMany({
        where: {
          userId,
          isArchived: false,
        },
        orderBy: [{ name: 'asc' }],
      }),
    ]);

    const incomeTransactions = transactions.filter(
      (item) => item.type === 'INCOME'
    );
    const expenseTransactions = transactions.filter(
      (item) => item.type === 'EXPENSE'
    );
    const transferTransactions = transactions.filter(
      (item) => item.type === 'TRANSFER'
    );

    const totalIncome = incomeTransactions.reduce(
      (sum, item) => sum + toNumber(item.amount),
      0
    );
    const totalExpenses = expenseTransactions.reduce(
      (sum, item) => sum + toNumber(item.amount),
      0
    );
    const totalTransfers = transferTransactions.reduce(
      (sum, item) => sum + toNumber(item.amount),
      0
    );

    const categoryMap = new Map(
      categories.map((category) => [
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

    const expenseByCategory = new Map<string, number>();
    const incomeByCategory = new Map<string, number>();
    const dailyCashFlow = new Map<
      string,
      { income: number; expenses: number; net: number }
    >();
    const accountActivity = new Map<
      string,
      {
        accountId: string;
        accountName: string;
        currency: string;
        income: number;
        expenses: number;
        transfersIn: number;
        transfersOut: number;
        net: number;
      }
    >();

    for (const transaction of transactions) {
      const amount = toNumber(transaction.amount);
      const dateKey = transaction.transactionDate.toISOString().slice(0, 10);
      const existingDay = dailyCashFlow.get(dateKey) ?? {
        income: 0,
        expenses: 0,
        net: 0,
      };

      const primaryAccount =
        accountActivity.get(transaction.accountId) ??
        ({
          accountId: transaction.account.id,
          accountName: transaction.account.name,
          currency: transaction.account.currency,
          income: 0,
          expenses: 0,
          transfersIn: 0,
          transfersOut: 0,
          net: 0,
        } as const);

      const mutablePrimaryAccount = {
        ...primaryAccount,
      };

      if (transaction.type === 'INCOME') {
        existingDay.income += amount;
        existingDay.net += amount;
        mutablePrimaryAccount.income += amount;
        mutablePrimaryAccount.net += amount;

        if (transaction.categoryId) {
          incomeByCategory.set(
            transaction.categoryId,
            (incomeByCategory.get(transaction.categoryId) ?? 0) + amount
          );
        }
      }

      if (transaction.type === 'EXPENSE') {
        existingDay.expenses += amount;
        existingDay.net -= amount;
        mutablePrimaryAccount.expenses += amount;
        mutablePrimaryAccount.net -= amount;

        if (transaction.categoryId) {
          expenseByCategory.set(
            transaction.categoryId,
            (expenseByCategory.get(transaction.categoryId) ?? 0) + amount
          );
        }
      }

      if (transaction.type === 'TRANSFER') {
        mutablePrimaryAccount.transfersOut += amount;
        mutablePrimaryAccount.net -= amount;

        if (transaction.transferAccount && transaction.transferAccountId) {
          const destinationAccount =
            accountActivity.get(transaction.transferAccountId) ??
            ({
              accountId: transaction.transferAccount.id,
              accountName: transaction.transferAccount.name,
              currency: transaction.transferAccount.currency,
              income: 0,
              expenses: 0,
              transfersIn: 0,
              transfersOut: 0,
              net: 0,
            } as const);

          accountActivity.set(transaction.transferAccountId, {
            ...destinationAccount,
            transfersIn: destinationAccount.transfersIn + amount,
            net: destinationAccount.net + amount,
          });
        }
      }

      dailyCashFlow.set(dateKey, existingDay);
      accountActivity.set(transaction.accountId, mutablePrimaryAccount);
    }

    const expenseCategoryBreakdown = Array.from(expenseByCategory.entries())
      .map(([categoryId, amount]) => ({
        category: categoryMap.get(categoryId) ?? null,
        amount,
      }))
      .sort((a, b) => b.amount - a.amount);

    const incomeCategoryBreakdown = Array.from(incomeByCategory.entries())
      .map(([categoryId, amount]) => ({
        category: categoryMap.get(categoryId) ?? null,
        amount,
      }))
      .sort((a, b) => b.amount - a.amount);

    return {
      period: {
        month: selectedMonth,
        year: selectedYear,
        start: periodStart.toISOString(),
        end: periodEnd.toISOString(),
      },
      totals: {
        income: totalIncome,
        expenses: totalExpenses,
        transfers: totalTransfers,
        net: totalIncome - totalExpenses,
        transactionCount: transactions.length,
      },
      topExpenseCategories: expenseCategoryBreakdown.slice(0, 5),
      expenseCategoryBreakdown,
      incomeCategoryBreakdown,
      dailyCashFlow: Array.from(dailyCashFlow.entries())
        .map(([date, values]) => ({
          date,
          ...values,
        }))
        .sort((a, b) => a.date.localeCompare(b.date)),
      accountActivity: accounts.map((account) => {
        const summary = accountActivity.get(account.id);

        return {
          accountId: account.id,
          accountName: account.name,
          type: account.type,
          currency: account.currency,
          income: summary?.income ?? 0,
          expenses: summary?.expenses ?? 0,
          transfersIn: summary?.transfersIn ?? 0,
          transfersOut: summary?.transfersOut ?? 0,
          net: summary?.net ?? 0,
        };
      }),
    };
  };
}

const reportsService = new ReportsService();

export default reportsService;
