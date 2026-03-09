import { z } from 'zod';

export const getMonthlyReportSchema = z.object({
  params: z.object({}),
  body: z.object({}).optional(),
  query: z.object({
    month: z.coerce.number().int().min(1).max(12).optional(),
    year: z.coerce.number().int().min(2000).max(9999).optional(),
  }),
});

export type GetMonthlyReportInput = z.infer<typeof getMonthlyReportSchema>['query'];
