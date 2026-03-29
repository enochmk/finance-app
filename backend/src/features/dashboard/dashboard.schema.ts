import { z } from 'zod';

const dashboardPresetSchema = z.enum([
  'today',
  'last7days',
  'last30days',
  'thisMonth',
  'lastMonth',
  'thisYear',
  'lastYear',
]);

const dashboardCompareBySchema = z.enum(['day', 'week', 'month', 'year']);

export const getDashboardSummarySchema = z.object({
  params: z.object({}),
  body: z.object({}).optional(),
  query: z.object({
    accountId: z.string().uuid('accountId must be a valid UUID').optional(),
    preset: dashboardPresetSchema.optional(),
    compareBy: dashboardCompareBySchema.optional(),
    month: z.coerce.number().int().min(1).max(12).optional(),
    year: z.coerce.number().int().min(2000).max(9999).optional(),
    recentLimit: z.coerce.number().int().min(1).max(20).optional(),
  }),
});

export type GetDashboardSummaryQuery = z.infer<
  typeof getDashboardSummarySchema
>['query'];
