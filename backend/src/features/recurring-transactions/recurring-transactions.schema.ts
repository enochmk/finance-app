import { z } from 'zod';

const recurringFrequencySchema = z.enum([
  'WEEKLY',
  'MONTHLY',
  'QUARTERLY',
  'YEARLY',
]);

const recurringStatusSchema = z.enum(['ACTIVE', 'PAUSED', 'COMPLETED']);
const transactionTypeSchema = z.enum(['INCOME', 'EXPENSE', 'TRANSFER']);

const recurringTransactionBodyFields = {
  accountId: z.string().uuid('accountId must be a valid UUID'),
  categoryId: z.string().uuid('categoryId must be a valid UUID').optional(),
  transferAccountId: z
    .string()
    .uuid('transferAccountId must be a valid UUID')
    .optional(),
  type: transactionTypeSchema,
  amount: z.number().finite().positive('Amount must be greater than zero'),
  description: z.string().trim().min(1).max(255),
  notes: z.string().trim().max(2000).optional(),
  frequency: recurringFrequencySchema,
  intervalCount: z.number().int().min(1).max(24).optional(),
  dayOfMonth: z.number().int().min(1).max(31).optional(),
  dayOfWeek: z.number().int().min(0).max(6).optional(),
  startDate: z.string().datetime({
    message: 'startDate must be a valid ISO datetime string',
  }),
  endDate: z
    .string()
    .datetime({ message: 'endDate must be a valid ISO datetime string' })
    .optional(),
  status: recurringStatusSchema.optional(),
  externalReference: z.string().trim().max(255).optional(),
};

const recurringTransactionBodySchema = z
  .object(recurringTransactionBodyFields)
  .superRefine((value, ctx) => {
    if (value.type === 'TRANSFER' && !value.transferAccountId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['transferAccountId'],
        message:
          'transferAccountId is required for transfer recurring transactions',
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

    if (
      (value.frequency === 'MONTHLY' ||
        value.frequency === 'QUARTERLY' ||
        value.frequency === 'YEARLY') &&
      value.dayOfMonth === undefined
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['dayOfMonth'],
        message:
          'dayOfMonth is required for monthly, quarterly, or yearly recurrence',
      });
    }

    if (value.frequency === 'WEEKLY' && value.dayOfWeek === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['dayOfWeek'],
        message: 'dayOfWeek is required for weekly recurrence',
      });
    }
  });

const updateRecurringTransactionBodySchema = z.object({
  accountId: recurringTransactionBodyFields.accountId.optional(),
  categoryId: recurringTransactionBodyFields.categoryId,
  transferAccountId: recurringTransactionBodyFields.transferAccountId,
  type: transactionTypeSchema.optional(),
  amount: recurringTransactionBodyFields.amount.optional(),
  description: recurringTransactionBodyFields.description.optional(),
  notes: recurringTransactionBodyFields.notes,
  frequency: recurringTransactionBodyFields.frequency.optional(),
  intervalCount: recurringTransactionBodyFields.intervalCount,
  dayOfMonth: recurringTransactionBodyFields.dayOfMonth,
  dayOfWeek: recurringTransactionBodyFields.dayOfWeek,
  startDate: recurringTransactionBodyFields.startDate.optional(),
  endDate: recurringTransactionBodyFields.endDate,
  status: recurringTransactionBodyFields.status,
  externalReference: recurringTransactionBodyFields.externalReference,
});

export const listRecurringTransactionsSchema = z.object({
  params: z.object({}),
  body: z.object({}).optional(),
  query: z.object({
    status: recurringStatusSchema.optional(),
    frequency: recurringFrequencySchema.optional(),
  }),
});

export const createRecurringTransactionSchema = z.object({
  params: z.object({}),
  query: z.object({}),
  body: recurringTransactionBodySchema,
});

export const updateRecurringTransactionSchema = z.object({
  params: z.object({
    id: z.string().uuid('Recurring transaction id must be a valid UUID'),
  }),
  query: z.object({}),
  body: updateRecurringTransactionBodySchema,
});

export const deleteRecurringTransactionSchema = z.object({
  params: z.object({
    id: z.string().uuid('Recurring transaction id must be a valid UUID'),
  }),
  query: z.object({}),
  body: z.object({}).optional(),
});

export const runRecurringTransactionsSchema = z.object({
  params: z.object({}),
  query: z.object({
    upTo: z
      .string()
      .datetime({ message: 'upTo must be a valid ISO datetime string' })
      .optional(),
  }),
  body: z.object({}).optional(),
});

export type ListRecurringTransactionsQuery = z.infer<
  typeof listRecurringTransactionsSchema
>['query'];
export type CreateRecurringTransactionBody = z.infer<
  typeof createRecurringTransactionSchema
>['body'];
export type UpdateRecurringTransactionParams = z.infer<
  typeof updateRecurringTransactionSchema
>['params'];
export type UpdateRecurringTransactionBody = z.infer<
  typeof updateRecurringTransactionSchema
>['body'];
export type DeleteRecurringTransactionParams = z.infer<
  typeof deleteRecurringTransactionSchema
>['params'];
export type RunRecurringTransactionsQuery = z.infer<
  typeof runRecurringTransactionsSchema
>['query'];
