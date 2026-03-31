import prisma from '../../libs/prisma';
import { DEFAULT_ACCOUNTS, DEFAULT_CATEGORIES } from './default-workspace';

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
          currency: 'GHS',
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
