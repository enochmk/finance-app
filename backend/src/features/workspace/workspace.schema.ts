import { z } from 'zod';

export const resetWorkspaceSchema = z.object({});

export type ResetWorkspaceBody = z.infer<typeof resetWorkspaceSchema>;
