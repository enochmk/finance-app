-- DropForeignKey
ALTER TABLE "RecurringTransaction" DROP CONSTRAINT IF EXISTS "RecurringTransaction_userId_fkey";
ALTER TABLE "RecurringTransaction" DROP CONSTRAINT IF EXISTS "RecurringTransaction_accountId_fkey";
ALTER TABLE "RecurringTransaction" DROP CONSTRAINT IF EXISTS "RecurringTransaction_categoryId_fkey";
ALTER TABLE "RecurringTransaction" DROP CONSTRAINT IF EXISTS "RecurringTransaction_subCategoryId_fkey";
ALTER TABLE "RecurringTransaction" DROP CONSTRAINT IF EXISTS "RecurringTransaction_transferAccountId_fkey";

-- DropTable
DROP TABLE IF EXISTS "RecurringTransaction";

-- DropEnum
DROP TYPE IF EXISTS "RecurrenceFrequency";
