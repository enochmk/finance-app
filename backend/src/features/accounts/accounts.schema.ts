import { z } from 'zod';

const accountTypeSchema = z.enum([
  'CASH',
  'CHECKING',
  'SAVINGS',
  'CREDIT_CARD',
  'INVESTMENT',
  'LOAN',
]);

const accountBodySchema = z.object({
  userId: z.string().uuid('userId must be a valid UUID'),
  name: z.string().trim().min(1).max(120),
  type: accountTypeSchema,
  currency: z.string().trim().length(3).toUpperCase().optional(),
  openingBalance: z.number().finite().optional(),
  currentBalance: z.number().finite().optional(),
  institutionName: z.string().trim().max(120).optional(),
  accountNumberMasked: z.string().trim().max(32).optional(),
  isArchived: z.boolean().optional(),
});

export const listAccountsSchema = z.object({
  query: z.object({
    userId: z.string().uuid('userId must be a valid UUID'),
    type: accountTypeSchema.optional(),
    isArchived: z.coerce.boolean().optional(),
  }),
  params: z.object({}),
  body: z.object({}).optional(),
});

export const createAccountSchema = z.object({
  body: accountBodySchema,
  params: z.object({}),
  query: z.object({}),
});

export const updateAccountSchema = z.object({
  params: z.object({
    id: z.string().uuid('Account id must be a valid UUID'),
  }),
  query: z.object({}),
  body: accountBodySchema.partial().extend({
    userId: z.string().uuid('userId must be a valid UUID'),
  }),
});

export const deleteAccountSchema = z.object({
  params: z.object({
    id: z.string().uuid('Account id must be a valid UUID'),
  }),
  query: z.object({
    userId: z.string().uuid('userId must be a valid UUID'),
  }),
  body: z.object({}).optional(),
});

export type ListAccountsInput = z.infer<typeof listAccountsSchema>['query'];
export type CreateAccountInput = z.infer<typeof createAccountSchema>['body'];
export type UpdateAccountInput = z.infer<typeof updateAccountSchema>['body'];
