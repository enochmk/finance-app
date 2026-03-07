import { PrismaClient } from '../../generated/prisma/client';

declare global {
  var __prisma__: PrismaClient | undefined;
}

const prisma =
  global.__prisma__ ??
  new PrismaClient({
    accelerateUrl: process.env.DATABASE_URL ?? '',
  });

if (process.env.NODE_ENV !== 'production') {
  global.__prisma__ = prisma;
}

export default prisma;
