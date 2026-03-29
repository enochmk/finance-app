import { z } from 'zod';

const budgetBodySchema = z.object({
  categoryId: z.string().uuid('categoryId must be a valid UUID'),
  amount: z.number().finite().positive('Amount must be greater than zero'),
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2000).max(9999),
  notes: z.string().trim().max(2000).optional(),
});

export const listBudgetsSchema = z.object({
  query: z.object({
    month: z.coerce.number().int().min(1).max(12).optional(),
    year: z.coerce.number().int().min(2000).max(9999).optional(),
    categoryId: z.string().uuid('categoryId must be a valid UUID').optional(),
  }),
  params: z.object({}),
  body: z.object({}).optional(),
});

export const createBudgetSchema = z.object({
  body: budgetBodySchema,
  params: z.object({}),
  query: z.object({}),
});

export const updateBudgetSchema = z.object({
  params: z.object({
    id: z.string().uuid('Budget id must be a valid UUID'),
  }),
  query: z.object({}),
  body: budgetBodySchema.partial(),
});

export const deleteBudgetSchema = z.object({
  params: z.object({
    id: z.string().uuid('Budget id must be a valid UUID'),
  }),
  query: z.object({}),
  body: z.object({}).optional(),
});

export type ListBudgetsQuery = z.infer<typeof listBudgetsSchema>['query'];
export type CreateBudgetBody = z.infer<typeof createBudgetSchema>['body'];
export type UpdateBudgetParams = z.infer<typeof updateBudgetSchema>['params'];
export type UpdateBudgetBody = z.infer<typeof updateBudgetSchema>['body'];
export type DeleteBudgetParams = z.infer<typeof deleteBudgetSchema>['params'];
