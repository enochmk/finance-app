import prisma from '../../libs/prisma';
import { DEFAULT_ACCOUNTS, DEFAULT_CATEGORIES_TREE } from './default-workspace';

class WorkspaceService {
  resetAll = async (userId: string) => {
    await prisma.$transaction(async (tx) => {
      await tx.transactions.deleteMany({ where: { userId } });
      await tx.accounts.deleteMany({ where: { userId } });
      await tx.categories.deleteMany({
        where: { userId, isSystem: false },
      });

      await tx.categories.deleteMany({
        where: { userId },
      });

      await tx.categories.createMany({
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

      await tx.accounts.createMany({
        data: DEFAULT_ACCOUNTS.map((account) => ({
          userId,
          name: account.name,
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
