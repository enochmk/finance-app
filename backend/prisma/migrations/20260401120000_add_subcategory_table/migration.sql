-- Step 1: Add subCategoryId columns FIRST so UPDATE statements can reference them
ALTER TABLE "Transaction" ADD COLUMN "subCategoryId" TEXT;
ALTER TABLE "RecurringTransaction" ADD COLUMN "subCategoryId" TEXT;

-- Step 2: CreateTable SubCategory
CREATE TABLE "SubCategory" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "icon" TEXT,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubCategory_pkey" PRIMARY KEY ("id")
);

-- Step 3: AddForeignKey SubCategory.categoryId → Category.id (needed before insert)
ALTER TABLE "SubCategory" ADD CONSTRAINT "SubCategory_categoryId_fkey"
    FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Step 4: Migrate existing child Category rows into SubCategory
-- Store the mapping old_child_category_id → new_sub_category_id in a temp table
CREATE TEMP TABLE _child_migration AS
SELECT
    c."id"                    AS old_category_id,
    c."parentId"              AS parent_category_id,
    gen_random_uuid()::text   AS new_sub_id,
    c."name"                  AS sub_name,
    c."icon"                  AS sub_icon,
    c."isSystem"              AS sub_is_system,
    c."isArchived"            AS sub_is_archived,
    c."createdAt"             AS sub_created_at,
    c."updatedAt"             AS sub_updated_at
FROM "Category" c
WHERE c."parentId" IS NOT NULL;

INSERT INTO "SubCategory" ("id", "categoryId", "name", "icon", "isSystem", "isArchived", "createdAt", "updatedAt")
SELECT new_sub_id, parent_category_id, sub_name, sub_icon, sub_is_system, sub_is_archived, sub_created_at, sub_updated_at
FROM _child_migration;

-- Step 5: Update Transaction rows referencing old child categories
UPDATE "Transaction" t
SET
    "categoryId"    = cm."parent_category_id",
    "subCategoryId" = cm."new_sub_id"
FROM _child_migration cm
WHERE t."categoryId" = cm."old_category_id";

-- Step 6: Update RecurringTransaction rows referencing old child categories
UPDATE "RecurringTransaction" rt
SET
    "categoryId"    = cm."parent_category_id",
    "subCategoryId" = cm."new_sub_id"
FROM _child_migration cm
WHERE rt."categoryId" = cm."old_category_id";

DROP TABLE _child_migration;

-- Step 7: Delete child Category rows (now migrated to SubCategory)
DELETE FROM "Category" WHERE "parentId" IS NOT NULL;

-- Step 8: Drop old parentId indexes and column from Category
DROP INDEX IF EXISTS "Category_userId_parentId_idx";
DROP INDEX IF EXISTS "Category_parentId_idx";
ALTER TABLE "Category" DROP COLUMN IF EXISTS "parentId";

-- Step 9: CreateIndex
CREATE INDEX "SubCategory_categoryId_idx" ON "SubCategory"("categoryId");
CREATE INDEX "Transaction_subCategoryId_idx" ON "Transaction"("subCategoryId");
CREATE INDEX "RecurringTransaction_subCategoryId_idx" ON "RecurringTransaction"("subCategoryId");

-- Step 10: AddForeignKey Transaction.subCategoryId → SubCategory.id
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_subCategoryId_fkey"
    FOREIGN KEY ("subCategoryId") REFERENCES "SubCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Step 11: AddForeignKey RecurringTransaction.subCategoryId → SubCategory.id
ALTER TABLE "RecurringTransaction" ADD CONSTRAINT "RecurringTransaction_subCategoryId_fkey"
    FOREIGN KEY ("subCategoryId") REFERENCES "SubCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
