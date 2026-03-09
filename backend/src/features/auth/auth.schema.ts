import { z } from 'zod';

export const registerSchema = z.object({
  params: z.object({}),
  query: z.object({}),
  body: z.object({
    email: z.string().trim().email(),
    password: z.string().min(8).max(128),
    name: z.string().trim().min(1).max(120),
    currency: z.string().trim().length(3).toUpperCase().optional(),
  }),
});

export const loginSchema = z.object({
  params: z.object({}),
  query: z.object({}),
  body: z.object({
    email: z.string().trim().email(),
    password: z.string().min(8).max(128),
  }),
});

export type RegisterInput = z.infer<typeof registerSchema>['body'];
export type LoginInput = z.infer<typeof loginSchema>['body'];
