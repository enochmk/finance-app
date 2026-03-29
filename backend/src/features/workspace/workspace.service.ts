import prisma from '../../libs/prisma';

const DEFAULT_CATEGORIES = [
  { name: 'Food & Drinks', type: 'EXPENSE' as const, color: '#b45309' },
  { name: 'Shopping', type: 'EXPENSE' as const, color: '#176b6c' },
  { name: 'Housing', type: 'EXPENSE' as const, color: '#9a3412' },
  { name: 'Transportation', type: 'EXPENSE' as const, color: '#f59e0b' },
  { name: 'Vehicle', type: 'EXPENSE' as const, color: '#475569' },
  { name: 'Life & Entertainment', type: 'EXPENSE' as const, color: '#be185d' },
  { name: 'Communications, PC', type: 'EXPENSE' as const, color: '#0f766e' },
  { name: 'Financial Expenses', type: 'EXPENSE' as const, color: '#7c3aed' },
  { name: 'Investments', type: 'EXPENSE' as const, color: '#1d4ed8' },
  { name: 'Income', type: 'INCOME' as const, color: '#15803d' },
] as const;

const DEFAULT_ACCOUNTS = [
  {
    name: 'Bank',
    type: 'CHECKING' as const,
    currency: 'GHS',
    color: '#1d4ed8',
    icon: 'Building2',
    openingBalance: 0,
  },
  {
    name: 'Savings',
    type: 'SAVINGS' as const,
    currency: 'GHS',
    color: '#15803d',
    icon: 'PiggyBank',
    openingBalance: 0,
  },
  {
    name: 'Mobile Money',
    type: 'CHECKING' as const,
    currency: 'GHS',
    color: '#f59e0b',
    icon: 'Smartphone',
    openingBalance: 0,
  },
  {
    name: 'Cash',
    type: 'CASH' as const,
    currency: 'GHS',
    color: '#7c3aed',
    icon: 'Wallet',
    openingBalance: 0,
  },
] as const;

class WorkspaceService {
  resetAll = async (userId: string) => {
    await prisma.$transaction(async (tx) => {
      await tx.recurringTransaction.deleteMany({ where: { userId } });
      await tx.budget.deleteMany({ where: { userId } });
      await tx.transaction.deleteMany({ where: { userId } });
      await tx.account.deleteMany({ where: { userId } });
      await tx.category.deleteMany({
        where: { userId, isSystem: false },
      });

      await tx.category.deleteMany({
        where: { userId },
      });

      await Promise.all(
        DEFAULT_CATEGORIES.map((category) =>
          tx.category.upsert({
            where: {
              userId_type_name: {
                userId,
                type: category.type,
                name: category.name,
              },
            },
            update: {
              color: category.color,
              isSystem: true,
              isArchived: false,
            },
            create: {
              userId,
              name: category.name,
              type: category.type,
              color: category.color,
              isSystem: true,
              isArchived: false,
            },
          })
        )
      );

      await tx.account.createMany({
        data: DEFAULT_ACCOUNTS.map((account) => ({
          userId,
          name: account.name,
          type: account.type,
          currency: account.currency,
          color: account.color,
          icon: account.icon,
          openingBalance: account.openingBalance,
          currentBalance: account.openingBalance,
          isArchived: false,
        })),
      });
    });
  };
}

const workspaceService = new WorkspaceService();

export default workspaceService;
