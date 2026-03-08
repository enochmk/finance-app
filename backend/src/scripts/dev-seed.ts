import '../env';

import prisma from '../libs/prisma';
import { getLogger } from '../libs/logger';
import { bootstrapDevData } from './bootstrap-dev';

const logger = getLogger('DevSeed');

async function run() {
  await bootstrapDevData();
  logger.info('Development seed completed successfully');
}

run()
  .catch((error) => {
    logger.error('Development seed failed', { error });
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
