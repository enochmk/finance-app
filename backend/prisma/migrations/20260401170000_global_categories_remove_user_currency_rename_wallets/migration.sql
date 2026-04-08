ALTER TABLE "accounts" RENAME TO "wallets";

ALTER TABLE "wallets" RENAME CONSTRAINT "accounts_pkey" TO "wallets_pkey";
ALTER TABLE "wallets" RENAME CONSTRAINT "accounts_userId_fkey" TO "wallets_userId_fkey";

ALTER INDEX "accounts_userId_idx" RENAME TO "wallets_userId_idx";
ALTER INDEX "accounts_userId_name_key" RENAME TO "wallets_userId_name_key";

ALTER TABLE "users" DROP COLUMN IF EXISTS "currency";

ALTER TABLE "categories" DROP CONSTRAINT IF EXISTS "categories_userId_fkey";

DROP INDEX IF EXISTS "categories_userId_type_idx";
DROP INDEX IF EXISTS "categories_userId_type_name_root_key";

ALTER TABLE "categories" DROP COLUMN IF EXISTS "userId";

CREATE INDEX IF NOT EXISTS "categories_type_idx" ON "categories"("type");