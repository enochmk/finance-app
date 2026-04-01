import { z } from 'zod';

import { entryTypeSchema } from '../../libs/entry-type';

const decimalAmountSchema = z
  .number()
  .finite('Amount must be a valid number')
  .positive('Amount must be greater than zero');

const isoDateSchema = z
  .string()
  .datetime({ message: 'transactionDate must be a valid ISO datetime string' });

const transactionBodyFields = {
  accountId: z.string().uuid('accountId must be a valid UUID'),
  categoryId: z.string().uuid('categoryId must be a valid UUID').optional(),
  type: entryTypeSchema,
  amount: decimalAmountSchema,
  description: z.string().trim().max(255).optional(),
  notes: z.string().trim().max(2000).optional(),
  transactionDate: isoDateSchema,
  transferAccountId: z
    .string()
    .uuid('transferAccountId must be a valid UUID')
    .optional(),
  externalReference: z.string().trim().max(255).optional(),
};

const baseTransactionBodySchema = z
  .object(transactionBodyFields)
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

const updateTransactionBodySchema = z
  .object({
    accountId: transactionBodyFields.accountId.optional(),
    categoryId: transactionBodyFields.categoryId,
    type: entryTypeSchema.optional(),
    amount: decimalAmountSchema.optional(),
    description: transactionBodyFields.description.optional(),
    notes: transactionBodyFields.notes,
    transactionDate: isoDateSchema.optional(),
    transferAccountId: transactionBodyFields.transferAccountId,
    externalReference: transactionBodyFields.externalReference,
  })
  .superRefine((value, ctx) => {
    if (
      value.transferAccountId &&
      value.accountId &&
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
    accountId: z.string().uuid('accountId must be a valid UUID').optional(),
    categoryId: z.string().uuid('categoryId must be a valid UUID').optional(),
    type: entryTypeSchema.optional(),
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
  body: updateTransactionBodySchema,
});

export const deleteTransactionSchema = z.object({
  params: z.object({
    id: z.string().uuid('Transaction id must be a valid UUID'),
  }),
  query: z.object({}),
  body: z.object({}).optional(),
});

export type ListTransactionsQuery = z.infer<
  typeof listTransactionsSchema
>['query'];
export type CreateTransactionBody = z.infer<
  typeof createTransactionSchema
>['body'];
export type UpdateTransactionParams = z.infer<
  typeof updateTransactionSchema
>['params'];
export type UpdateTransactionBody = z.infer<
  typeof updateTransactionSchema
>['body'];
export type DeleteTransactionParams = z.infer<
  typeof deleteTransactionSchema
>['params'];
