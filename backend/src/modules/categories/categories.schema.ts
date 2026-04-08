import { z } from 'zod';

import { entryTypeSchema } from '../../libs/entry-type';

const categoryBodySchema = z.object({
  name: z.string().trim().min(1).max(80),
  type: entryTypeSchema,
  color: z.string().trim().max(32).optional(),
  icon: z.string().trim().max(64).optional(),
  parentId: z.string().uuid().nullable().optional(),
  isSystem: z.boolean().optional(),
  isArchived: z.boolean().optional(),
});

export const listCategoriesSchema = z.object({
  query: z.object({
    type: entryTypeSchema.optional(),
    isArchived: z.coerce.boolean().optional(),
  }),
  params: z.object({}),
  body: z.object({}).optional(),
});

export const createCategorySchema = z.object({
  body: categoryBodySchema,
  params: z.object({}),
  query: z.object({}),
});

export const updateCategorySchema = z.object({
  params: z.object({
    id: z.string().uuid('Category id must be a valid UUID'),
  }),
  query: z.object({}),
  body: categoryBodySchema.partial(),
});

export const deleteCategorySchema = z.object({
  params: z.object({
    id: z.string().uuid('Category id must be a valid UUID'),
  }),
  query: z.object({}),
  body: z.object({}).optional(),
});

export const seedCategoriesSchema = z.object({
  params: z.object({}),
  query: z.object({}),
  body: z.object({}).optional(),
});

export const subCategoryParamsSchema = z.object({
  categoryId: z.string().uuid('Category id must be a valid UUID'),
});

export const subCategoryIdParamsSchema = z.object({
  categoryId: z.string().uuid('Category id must be a valid UUID'),
  id: z.string().uuid('Subcategory id must be a valid UUID'),
});

export const listSubCategoriesSchema = z.object({
  params: subCategoryParamsSchema,
  query: z.object({
    isArchived: z.coerce.boolean().optional(),
  }),
  body: z.object({}).optional(),
});

export const createSubCategorySchema = z.object({
  params: subCategoryParamsSchema,
  query: z.object({}),
  body: z.object({
    name: z.string().trim().min(1).max(80),
    icon: z.string().trim().max(64).optional(),
    isSystem: z.boolean().optional(),
    isArchived: z.boolean().optional(),
  }),
});

export const updateSubCategorySchema = z.object({
  params: subCategoryIdParamsSchema,
  query: z.object({}),
  body: z.object({
    name: z.string().trim().min(1).max(80).optional(),
    icon: z.string().trim().max(64).optional(),
    isSystem: z.boolean().optional(),
    isArchived: z.boolean().optional(),
  }),
});

export const deleteSubCategorySchema = z.object({
  params: subCategoryIdParamsSchema,
  query: z.object({}),
  body: z.object({}).optional(),
});

export type ListCategoriesQuery = z.infer<typeof listCategoriesSchema>['query'];
export type CreateCategoryBody = z.infer<typeof createCategorySchema>['body'];
export type UpdateCategoryParams = z.infer<
  typeof updateCategorySchema
>['params'];
export type UpdateCategoryBody = z.infer<typeof updateCategorySchema>['body'];
export type DeleteCategoryParams = z.infer<
  typeof deleteCategorySchema
>['params'];
export type SeedCategoriesBody = z.infer<typeof seedCategoriesSchema>['body'];
export type ListSubCategoriesQuery = z.infer<
  typeof listSubCategoriesSchema
>['query'];
export type CreateSubCategoryBody = z.infer<
  typeof createSubCategorySchema
>['body'];
export type UpdateSubCategoryBody = z.infer<
  typeof updateSubCategorySchema
>['body'];
export type UpdateSubCategoryParams = z.infer<
  typeof updateSubCategorySchema
>['params'];
export type DeleteSubCategoryParams = z.infer<
  typeof deleteSubCategorySchema
>['params'];
