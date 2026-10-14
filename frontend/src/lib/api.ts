import 'server-only';
import type { ApiError, ProductPage } from './types';

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
