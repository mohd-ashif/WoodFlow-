import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

// Load .env from root workspace
dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });
dotenv.config();

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  JWT_SECRET: z.string().min(8, 'JWT_SECRET must be at least 8 chars'),
  JWT_REFRESH_SECRET: z.string().min(8, 'JWT_REFRESH_SECRET must be at least 8 chars'),
  JWT_EXPIRES_IN: z.string().default('1d'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  PORT: z.coerce.number().default(4000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
  REDIS_URL: z.string().optional(),
  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).default('info'),
  VERSION: z.string().default('1.0.0'),
});

const parsedEnv = envSchema.parse(process.env);

// Production fail-fast assertions
if (parsedEnv.NODE_ENV === 'production') {
  if (parsedEnv.JWT_SECRET.includes('change_in_production') || parsedEnv.JWT_SECRET.includes('super_secret_key')) {
    throw new Error('FATAL: Default JWT_SECRET detected in production environment!');
  }
  if (parsedEnv.JWT_REFRESH_SECRET.includes('change_in_production') || parsedEnv.JWT_REFRESH_SECRET.includes('super_secret_key')) {
    throw new Error('FATAL: Default JWT_REFRESH_SECRET detected in production environment!');
  }
  if (parsedEnv.CORS_ORIGIN === '*') {
    throw new Error('FATAL: Wildcard CORS_ORIGIN (*) is not allowed in production!');
  }
}

export const env = parsedEnv;

