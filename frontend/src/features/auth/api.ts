import 'server-only';
import { cookies } from 'next/headers';
import type { User } from './types';
import { API_URL } from '@/shared/api/http';

// Server-to-server: the browser's cookie does NOT travel by itself. We forward it by hand.
export async function getMe(): Promise<User | null> {
  const session = (await cookies()).get('session'); // cookies() is async since Next 15
  if (!session) return null;

  const res = await fetch(`${API_URL}/auth/me`, {
    headers: { Cookie: `session=${session.value}` }, // only the cookie Nest needs
    cache: 'no-store',
  });
  if (res.status === 401) return null;
  if (!res.ok) throw new Error(`GET /auth/me failed with ${res.status}`);
  return (await res.json()) as User;
}
