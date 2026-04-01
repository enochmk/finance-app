/*
  Warnings:

  - You are about to drop the column `type` on the `accounts` table. All the data in the column will be lost.
  - You are about to drop the `Budget` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Budget" DROP CONSTRAINT "Budget_categoryId_fkey";

-- DropForeignKey
ALTER TABLE "Budget" DROP CONSTRAINT "Budget_userId_fkey";

-- AlterTable
ALTER TABLE "accounts" DROP COLUMN "type";

-- DropTable
DROP TABLE "Budget";

-- DropEnum
DROP TYPE "AccountType";
