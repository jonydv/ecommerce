import { z } from 'zod';

export const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3001),
  FRONTEND_ORIGIN: z.url(),
  DATABASE_URL: z.url(),
});

export type Env = z.infer<typeof envSchema>;