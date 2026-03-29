import { z } from 'zod';

const categoryTypeSchema = z.enum(['INCOME', 'EXPENSE']);

const categoryBodySchema = z.object({
  name: z.string().trim().min(1).max(80),
  type: categoryTypeSchema,
  color: z.string().trim().max(32).optional(),
  icon: z.string().trim().max(64).optional(),
  isSystem: z.boolean().optional(),
  isArchived: z.boolean().optional(),
});

export const listCategoriesSchema = z.object({
  query: z.object({
    type: categoryTypeSchema.optional(),
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
