import dotenv from 'dotenv';
import { z } from 'zod';

// Load environment variables
const envFile = process.env.NODE_ENV === 'development' ? '.env.development' 
  : process.env.NODE_ENV === 'test' ? '.env.test' 
  : '.env';

dotenv.config({
  path: envFile
});

const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().url(),
  
  // Redis
  REDIS_URL: z.string().url(),
  
  // JWT
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('24h'),
  
  // Solana
  SOLANA_RPC_URL: z.string().url(),
  SOLANA_PROGRAM_ID: z.string(),
  SOLANA_COMMITMENT: z.enum(['processed', 'confirmed', 'finalized']).default('confirmed'),
  
  // Server
  PORT: z.string().transform(Number).pipe(z.number().int().positive()).default('3000'),
  NODE_ENV: z.enum(['development', 'staging', 'production', 'test']).default('development'),
  
  // CORS
  CORS_ORIGIN: z.string(),
  
  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.string().transform(Number).pipe(z.number().int().positive()).default('900000'),
  RATE_LIMIT_MAX_REQUESTS: z.string().transform(Number).pipe(z.number().int().positive()).default('100'),
  
  // WebSocket
  WEBSOCKET_CORS_ORIGIN: z.string(),
  
  // Logging
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  LOG_FILE: z.string().default('logs/app.log'),
  
  // Bull Queue
  BULL_REDIS_URL: z.string().url(),
  
  // Security
  HELMET_CSP_ENABLED: z.string().transform(val => val === 'true').default('true')
});

const parseResult = envSchema.safeParse(process.env);

if (!parseResult.success) {
  console.error('❌ Invalid environment variables:', parseResult.error.format());
  process.exit(1);
}

export const env = parseResult.data;

export const isDevelopment = env.NODE_ENV === 'development';
export const isProduction = env.NODE_ENV === 'production';
export const isStaging = env.NODE_ENV === 'staging';
