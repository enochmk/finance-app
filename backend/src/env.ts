import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  FRONTEND_ORIGINS: z
    .string()
    .default('http://localhost:3000,http://127.0.0.1:3000'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  BCRYPT_ROUNDS: z.coerce.number().int().min(4).max(15).default(10),
  LOG_DIRECTORY: z.string().default('logs'),
  LOG_LEVEL: z.string().default('debug'),
  LOG_CONSOLE_LEVEL: z.string().default('debug'),
  LOG_DATE_PATTERN: z.string().default('YYYYMMDD'),
  ENABLE_DEV_SEED: z.coerce.boolean().default(false),
  DEV_SEED_USER_EMAIL: z.string().email().default('dev@budget.local'),
  DEV_SEED_USER_NAME: z.string().min(1).default('Budget Dev User'),
  DEV_SEED_USER_PASSWORD: z.string().min(8).default('dev-password-123'),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  const message = parsedEnv.error.issues
    .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
    .join('; ');

  throw new Error(`Invalid environment configuration: ${message}`);
}

export const env = parsedEnv.data;

export default env;
