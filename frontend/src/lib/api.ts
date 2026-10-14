import 'server-only';
import type { ApiError, ProductPage, User } from './types';
import { cookies } from 'next/headers';

const API_URL = process.env.API_URL ?? 'http://localhost:3001';

export class ApiRequestError extends Error {
  constructor(
    readonly status: number,
    readonly requestId: string,
    message: string,
  ) {
    super(`${message} (status ${status}, requestId ${requestId})`);
    this.name = 'ApiRequestError';
  }
}

async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, { cache: 'no-store' });
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as ApiError | null;
    const requestId =
      body?.requestId ?? res.headers.get('x-request-id') ?? 'unknown';
    const error = new ApiRequestError(
      res.status,
      requestId,
      body?.message ?? res.statusText,
    );
    console.error(`[api] GET ${path} failed`, error.message);
    throw error;
  }
  return (await res.json()) as T;
}

export const getProducts = (limit = 12) =>
  apiGet<ProductPage>(`/products?limit=${limit}`);

// Server-to-server: the browser's cookie does NOT travel by itself. We forward it by hand.
export async function getMe(): Promise<User | null> {
  const session = (await cookies()).get('session'); // cookies() is async since Next 15
  if (!session) return null;

  const res = await fetch(`${process.env.API_URL}/auth/me`, {
    headers: { Cookie: `session=${session.value}` }, // only the cookie Nest needs
    cache: 'no-store',
  });
  if (res.status === 401) return null;
  if (!res.ok) throw new Error(`GET /auth/me failed with ${res.status}`);
  return (await res.json()) as User;
}
