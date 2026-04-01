import prisma from '../../libs/prisma';
import { DEFAULT_ACCOUNTS, DEFAULT_CATEGORIES_TREE } from './default-workspace';

class WorkspaceService {
  resetAll = async (userId: string) => {
    await prisma.$transaction(async (tx) => {
      await tx.budget.deleteMany({ where: { userId } });
      await tx.transaction.deleteMany({ where: { userId } });
      await tx.account.deleteMany({ where: { userId } });
      await tx.category.deleteMany({
        where: { userId, isSystem: false },
      });

      await tx.category.deleteMany({
        where: { userId },
      });

      await tx.category.createMany({
        data: DEFAULT_CATEGORIES_TREE.map((category) => ({
          userId,
          name: category.name,
          type: category.type,
          color: category.color,
          isSystem: true,
          isArchived: false,
          parentId: null,
        })),
        skipDuplicates: true,
      });

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
