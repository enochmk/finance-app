import { z } from 'zod';

export const getDashboardSummarySchema = z.object({
  params: z.object({}),
  body: z.object({}).optional(),
  query: z.object({
    month: z.coerce.number().int().min(1).max(12).optional(),
    year: z.coerce.number().int().min(2000).max(9999).optional(),
    recentLimit: z.coerce.number().int().min(1).max(20).optional(),
  }),
});

export type GetDashboardSummaryInput = z.infer<
  typeof getDashboardSummarySchema
>['query'];
