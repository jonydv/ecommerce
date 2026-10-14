import { hash, verify } from '@node-rs/argon2';

// OWASP minimum for Argon2id: 19 MiB, 2 passes, 1 lane. Same numbers as B3.
// algorithm/version stay at the library defaults (Argon2id, v0x13): its const enums
// can't be imported with isolatedModules (TS2748). You verify them by reading the hash.
const ARGON = { memoryCost: 19456, timeCost: 2, parallelism: 1 };

export const hashPassword = (plain: string) => hash(plain, ARGON);
export const verifyPassword = (stored: string, plain: string) =>
  verify(stored, plain);

// The ONE place where an email becomes canonical. Register, login and the seed call it.
export const normalizeEmail = (raw: string) => raw.trim().toLowerCase();
