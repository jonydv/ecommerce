import { z } from 'zod';

export const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3001),
  FRONTEND_ORIGIN: z.url(),
  DATABASE_URL: z.url(),
  JWT_SECRET: z.string().min(32), // used for sync sign/verify in the first 4 steps (E0-E4). 32 bytes is 256 bits
});

export type Env = z.infer<typeof envSchema>;
