'use client';

import { useRouter } from 'next/navigation';
import { PUBLIC_API_URL } from '@/shared/config/public-env';

export function LogoutButton() {
  const router = useRouter();
  async function logout() {
    await fetch(`${PUBLIC_API_URL}/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    });
    router.push('/login');
  }
  return (
    <button onClick={logout} className='border p-2'>
      Salir
    </button>
  );
}
