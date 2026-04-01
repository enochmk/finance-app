ALTER TYPE "CategoryType" RENAME TO "entry_type";

ALTER TABLE "Transaction"
ALTER COLUMN "type" TYPE "entry_type"
USING ("type"::text::"entry_type");

DROP TYPE "TransactionType";

ALTER TABLE "Currency" RENAME TO "currencies";
ALTER TABLE "User" RENAME TO "users";
ALTER TABLE "Account" RENAME TO "accounts";
ALTER TABLE "Category" RENAME TO "categories";
ALTER TABLE "SubCategory" RENAME TO "sub_categories";
ALTER TABLE "Transaction" RENAME TO "transactions";

ALTER TABLE "currencies" RENAME CONSTRAINT "Currency_pkey" TO "currencies_pkey";
ALTER INDEX "Currency_shortcode_key" RENAME TO "currencies_shortcode_key";

ALTER TABLE "users" RENAME CONSTRAINT "User_pkey" TO "users_pkey";
ALTER INDEX "User_email_key" RENAME TO "users_email_key";

ALTER TABLE "accounts" RENAME CONSTRAINT "Account_pkey" TO "accounts_pkey";
ALTER TABLE "accounts" RENAME CONSTRAINT "Account_userId_fkey" TO "accounts_userId_fkey";
ALTER INDEX "Account_userId_idx" RENAME TO "accounts_userId_idx";
ALTER INDEX "Account_userId_name_key" RENAME TO "accounts_userId_name_key";

ALTER TABLE "categories" RENAME CONSTRAINT "Category_pkey" TO "categories_pkey";
ALTER TABLE "categories" RENAME CONSTRAINT "Category_userId_fkey" TO "categories_userId_fkey";
ALTER INDEX "Category_userId_type_idx" RENAME TO "categories_userId_type_idx";

ALTER TABLE "sub_categories" RENAME CONSTRAINT "SubCategory_pkey" TO "sub_categories_pkey";
ALTER TABLE "sub_categories" RENAME CONSTRAINT "SubCategory_categoryId_fkey" TO "sub_categories_categoryId_fkey";
ALTER INDEX "SubCategory_categoryId_idx" RENAME TO "sub_categories_categoryId_idx";

ALTER TABLE "transactions" RENAME CONSTRAINT "Transaction_pkey" TO "transactions_pkey";
ALTER TABLE "transactions" RENAME CONSTRAINT "Transaction_userId_fkey" TO "transactions_userId_fkey";
ALTER TABLE "transactions" RENAME CONSTRAINT "Transaction_accountId_fkey" TO "transactions_accountId_fkey";
ALTER TABLE "transactions" RENAME CONSTRAINT "Transaction_categoryId_fkey" TO "transactions_categoryId_fkey";
ALTER TABLE "transactions" RENAME CONSTRAINT "Transaction_subCategoryId_fkey" TO "transactions_subCategoryId_fkey";
ALTER TABLE "transactions" RENAME CONSTRAINT "Transaction_transferAccountId_fkey" TO "transactions_transferAccountId_fkey";
ALTER INDEX "Transaction_userId_transactionDate_idx" RENAME TO "transactions_userId_transactionDate_idx";
ALTER INDEX "Transaction_accountId_transactionDate_idx" RENAME TO "transactions_accountId_transactionDate_idx";
ALTER INDEX "Transaction_categoryId_idx" RENAME TO "transactions_categoryId_idx";
ALTER INDEX "Transaction_subCategoryId_idx" RENAME TO "transactions_subCategoryId_idx";
ALTER INDEX "Transaction_transferAccountId_idx" RENAME TO "transactions_transferAccountId_idx";
