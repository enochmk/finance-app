import { z } from 'zod';

const budgetBodySchema = z.object({
  userId: z.string().uuid('userId must be a valid UUID'),
  categoryId: z.string().uuid('categoryId must be a valid UUID'),
  amount: z.number().finite().positive('Amount must be greater than zero'),
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2000).max(9999),
  notes: z.string().trim().max(2000).optional(),
});

export const listBudgetsSchema = z.object({
  query: z.object({
    userId: z.string().uuid('userId must be a valid UUID'),
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
  body: budgetBodySchema.partial().extend({
    userId: z.string().uuid('userId must be a valid UUID'),
  }),
});

export const deleteBudgetSchema = z.object({
  params: z.object({
    id: z.string().uuid('Budget id must be a valid UUID'),
  }),
  query: z.object({
    userId: z.string().uuid('userId must be a valid UUID'),
  }),
  body: z.object({}).optional(),
});

export type ListBudgetsInput = z.infer<typeof listBudgetsSchema>['query'];
export type CreateBudgetInput = z.infer<typeof createBudgetSchema>['body'];
export type UpdateBudgetInput = z.infer<typeof updateBudgetSchema>['body'];
