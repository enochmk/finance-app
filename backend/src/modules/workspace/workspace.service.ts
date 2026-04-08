import prisma from '../../libs/prisma';
import { DEFAULT_ACCOUNTS } from './default-workspace';

class WorkspaceService {
  resetAll = async (userId: string) => {
    await prisma.$transaction(async (tx) => {
      await tx.transactions.deleteMany({ where: { userId } });
      await tx.wallets.deleteMany({ where: { userId } });

      await tx.wallets.createMany({
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
