import '../env';

import fs from 'fs';
import path from 'path';

import prisma from '../libs/prisma';
import { getLogger } from '../libs/logger';

const logger = getLogger('BackupTransactions');

const TARGET_EMAIL = 'enochmk94@gmail.com';

async function run() {
  const user = await prisma.users.findUnique({
    where: { email: TARGET_EMAIL },
    select: { id: true, email: true, name: true },
  });

  if (!user) {
    logger.error(`User not found: ${TARGET_EMAIL}`);
    process.exitCode = 1;
    return;
  }

  logger.info(`Found user: ${user.name} (${user.email})`);

  const transactions = await prisma.transactions.findMany({
    where: { userId: user.id },
    orderBy: { transactionDate: 'asc' },
    select: {
      id: true,
      userId: true,
      accountId: true,
      categoryId: true,
      type: true,
      amount: true,
      description: true,
      notes: true,
      transactionDate: true,
      transferAccountId: true,
      externalReference: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  logger.info(`Found ${transactions.length} transactions`);

  const payload = {
    exportedAt: new Date().toISOString(),
    user: { id: user.id, email: user.email, name: user.name },
    transactions,
  };

  const outputDir = path.resolve(__dirname, '../../backups');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const outputPath = path.join(outputDir, `transactions-${timestamp}.json`);
  fs.writeFileSync(outputPath, JSON.stringify(payload, null, 2), 'utf-8');

  logger.info(`Backup written to: ${outputPath}`);
}

run()
  .catch((error) => {
    logger.error('Backup failed: ' + String(error));
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
