/*
  Warnings:

  - You are about to drop the column `entryMode` on the `Account` table. All the data in the column will be lost.
  - You are about to drop the column `entryMode` on the `Transaction` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Account" DROP COLUMN "entryMode",
ADD COLUMN     "icon" TEXT,
ADD COLUMN     "position" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Transaction" DROP COLUMN "entryMode";

-- DropEnum
DROP TYPE "EntryMode";
