import { z } from 'zod';

export const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3001),
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  FRONTEND_ORIGIN: z.url(),
  DATABASE_URL: z.url(),
  JWT_SECRET: z.string().min(32), // used for sync sign/verify in the first 4 steps (E0-E4). 32 bytes is 256 bits
  // E2-05 · sign-in with Google. Optional: without the client, the button answers "not configured"
  GOOGLE_CLIENT_ID: z.string().min(1).optional(),
  GOOGLE_CLIENT_SECRET: z.string().min(1).optional(),
  GOOGLE_REDIRECT_URI: z
    .url()
    .default('http://localhost:3001/auth/google/callback'), // EXACTLY as registered in Google
  GOOGLE_ISSUER: z.url().default('https://accounts.google.com'), // the e2e tests point it at a local fake
});

export type Env = z.infer<typeof envSchema>;
