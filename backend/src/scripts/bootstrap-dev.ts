import prisma from '../libs/prisma';
import env from '../env';
import { AccountType, CategoryType } from '../../generated/prisma/enums';
import { getLogger } from '../libs/logger';

const logger = getLogger('BootstrapDev');

export async function bootstrapDevData() {
  if (env.NODE_ENV !== 'development' || !env.ENABLE_DEV_SEED) {
    return;
  }

  const user = await prisma.user.upsert({
    where: { email: env.DEV_SEED_USER_EMAIL },
    update: { name: env.DEV_SEED_USER_NAME },
    create: {
      email: env.DEV_SEED_USER_EMAIL,
      name: env.DEV_SEED_USER_NAME,
      passwordHash: 'dev-seed-password',
    },
  });

  await prisma.account.upsert({
    where: {
      userId_name: {
        userId: user.id,
        name: 'Main Checking',
      },
    },
    update: {
      type: AccountType.CHECKING,
      currentBalance: 2500,
    },
    create: {
      userId: user.id,
      name: 'Main Checking',
      type: AccountType.CHECKING,
      currency: 'USD',
      openingBalance: 2500,
      currentBalance: 2500,
    },
  });

  await prisma.category.upsert({
    where: {
      userId_type_name: {
        userId: user.id,
        type: CategoryType.EXPENSE,
        name: 'Groceries',
      },
    },
    update: {
      color: '#2F855A',
      icon: 'shopping-cart',
    },
    create: {
      userId: user.id,
      name: 'Groceries',
      type: CategoryType.EXPENSE,
      color: '#2F855A',
      icon: 'shopping-cart',
    },
  });

  await prisma.category.upsert({
    where: {
      userId_type_name: {
        userId: user.id,
        type: CategoryType.INCOME,
        name: 'Salary',
      },
    },
    update: {
      color: '#1F4F99',
      icon: 'briefcase',
    },
    create: {
      userId: user.id,
      name: 'Salary',
      type: CategoryType.INCOME,
      color: '#1F4F99',
      icon: 'briefcase',
    },
  });

  logger.info('Development bootstrap data is ready', {
    userId: user.id,
    email: user.email,
  });
}
