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
  body: accountBodySchema.partial(),
});

export const deleteAccountSchema = z.object({
  params: z.object({
    id: z.string().uuid('Account id must be a valid UUID'),
  }),
  query: z.object({}),
  body: z.object({}).optional(),
});

export type ListAccountsQuery = z.infer<typeof listAccountsSchema>['query'];
export type CreateAccountBody = z.infer<typeof createAccountSchema>['body'];
export type UpdateAccountParams = z.infer<typeof updateAccountSchema>['params'];
export type UpdateAccountBody = z.infer<typeof updateAccountSchema>['body'];
export type DeleteAccountParams = z.infer<typeof deleteAccountSchema>['params'];
