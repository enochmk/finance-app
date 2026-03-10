import '../env';

import prisma from '../libs/prisma';
import { getLogger } from '../libs/logger';

const logger = getLogger('RemoveFutureTransactions');

async function run() {
  const now = new Date();
  logger.info(
    'Removing transactions with transaction date after current time',
    { now }
  );

  const result = await prisma.transaction.deleteMany({
    where: {
      transactionDate: {
        gt: now,
      },
    },
  });

  logger.info(`Deleted ${result.count} transactions`);
}

run()
  .catch((error) => {
    logger.error('Failed to remove future transactions', { error });
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
