import { z } from 'zod';

const transactionTypeSchema = z.enum(['INCOME', 'EXPENSE', 'TRANSFER']);

const decimalAmountSchema = z
  .number()
  .finite('Amount must be a valid number')
  .positive('Amount must be greater than zero');

const isoDateSchema = z
  .string()
  .datetime({ message: 'transactionDate must be a valid ISO datetime string' });

const baseTransactionBodySchema = z
  .object({
    userId: z.string().uuid('userId must be a valid UUID'),
    accountId: z.string().uuid('accountId must be a valid UUID'),
    categoryId: z.string().uuid('categoryId must be a valid UUID').optional(),
    type: transactionTypeSchema,
    amount: decimalAmountSchema,
    description: z.string().trim().min(1).max(255),
    notes: z.string().trim().max(2000).optional(),
    transactionDate: isoDateSchema,
    transferAccountId: z
      .string()
      .uuid('transferAccountId must be a valid UUID')
      .optional(),
    externalReference: z.string().trim().max(255).optional(),
  })
  .superRefine((value, ctx) => {
    if (value.type === 'TRANSFER' && !value.transferAccountId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['transferAccountId'],
        message: 'transferAccountId is required for transfer transactions',
      });
    }

    if (
      value.transferAccountId &&
      value.transferAccountId === value.accountId
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['transferAccountId'],
        message: 'transferAccountId must be different from accountId',
      });
    }
  });

export const listTransactionsSchema = z.object({
  query: z.object({
    userId: z.string().uuid('userId must be a valid UUID'),
    accountId: z.string().uuid('accountId must be a valid UUID').optional(),
    categoryId: z.string().uuid('categoryId must be a valid UUID').optional(),
    type: transactionTypeSchema.optional(),
    from: isoDateSchema.optional(),
    to: isoDateSchema.optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
  }),
  params: z.object({}),
  body: z.object({}).optional(),
});

export const createTransactionSchema = z.object({
  body: baseTransactionBodySchema,
  params: z.object({}),
  query: z.object({}),
});

export const updateTransactionSchema = z.object({
  params: z.object({
    id: z.string().uuid('Transaction id must be a valid UUID'),
  }),
  query: z.object({}),
  body: baseTransactionBodySchema.partial().extend({
    userId: z.string().uuid('userId must be a valid UUID'),
  }),
});

export const deleteTransactionSchema = z.object({
  params: z.object({
    id: z.string().uuid('Transaction id must be a valid UUID'),
  }),
  query: z.object({
    userId: z.string().uuid('userId must be a valid UUID'),
  }),
  body: z.object({}).optional(),
});

export type ListTransactionsInput = z.infer<
  typeof listTransactionsSchema
>['query'];
export type CreateTransactionInput = z.infer<
  typeof createTransactionSchema
>['body'];
export type UpdateTransactionInput = z.infer<
  typeof updateTransactionSchema
>['body'];
