import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

import { PrismaClient } from '../../generated/prisma/client';

import env from '../env';

declare global {
  var __prisma__: PrismaClient | undefined;
}

const connectionPool = new pg.Pool({
  connectionString: env.DATABASE_URL,
});

const adapter = new PrismaPg(connectionPool);

const prisma =
  global.__prisma__ ??
  new PrismaClient({
    adapter,
  });

if (process.env.NODE_ENV !== 'production') {
  global.__prisma__ = prisma;
}

export default prisma;
