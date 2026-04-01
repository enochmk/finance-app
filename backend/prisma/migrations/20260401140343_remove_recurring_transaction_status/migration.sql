-- DropIndex
DROP INDEX "RecurringTransaction_userId_status_nextRunAt_idx";

-- CreateIndex
CREATE INDEX "RecurringTransaction_userId_nextRunAt_idx" ON "RecurringTransaction"("userId", "nextRunAt");

-- AlterTable
ALTER TABLE "RecurringTransaction" DROP COLUMN "status";

-- DropEnum
DROP TYPE "RecurringTransactionStatus";
