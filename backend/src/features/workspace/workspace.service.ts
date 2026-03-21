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
    });
  };
}

const workspaceService = new WorkspaceService();

export default workspaceService;
