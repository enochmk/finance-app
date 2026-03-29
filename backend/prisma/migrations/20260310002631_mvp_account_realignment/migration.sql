-- CreateEnum
CREATE TYPE "EntryMode" AS ENUM ('MANUAL', 'AUTOMATED');

-- AlterTable
ALTER TABLE "Account" ADD COLUMN     "color" TEXT DEFAULT '#176b6c',
ADD COLUMN     "entryMode" "EntryMode" NOT NULL DEFAULT 'MANUAL',
ALTER COLUMN "currency" SET DEFAULT 'GHS';

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "entryMode" "EntryMode" NOT NULL DEFAULT 'MANUAL';

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "currency" SET DEFAULT 'GHS';
