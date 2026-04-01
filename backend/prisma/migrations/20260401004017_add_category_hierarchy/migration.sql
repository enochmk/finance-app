-- AlterEnum
ALTER TYPE "CategoryType" ADD VALUE 'TRANSFER';

-- DropIndex
DROP INDEX "Category_userId_type_name_key";

-- AlterTable
ALTER TABLE "Category" ADD COLUMN     "parentId" TEXT;

-- CreateIndex
CREATE INDEX "Category_userId_parentId_idx" ON "Category"("userId", "parentId");

-- CreateIndex
CREATE INDEX "Category_parentId_idx" ON "Category"("parentId");

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Add partial unique indexes: root categories unique by (userId, type, name), children unique by (parentId, name)
CREATE UNIQUE INDEX "Category_userId_type_name_root_key" ON "Category"("userId", "type", "name") WHERE "parentId" IS NULL;
CREATE UNIQUE INDEX "Category_parentId_name_key" ON "Category"("parentId", "name") WHERE "parentId" IS NOT NULL;
