'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { PUBLIC_API_URL } from '@/shared/config/public-env';

const API = PUBLIC_API_URL;

export function AuthForm({ mode }: { mode: 'login' | 'register' }) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setPending(true);
    setMessage(null);
    try {
      const res = await fetch(`${API}/auth/${mode}`, {
        method: 'POST',
        credentials: 'include', // without this, the browser ignores the Set-Cookie
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.get('email'),
          password: form.get('password'),
        }),
      });
      if (mode === 'register' && res.status === 202) {
        return setMessage(
          'Listo. Si el email no estaba registrado, ya podés entrar.',
        );
      }
      if (res.ok) return router.push('/account');
      setMessage(
        res.status === 401
          ? 'Email o contraseña incorrectos.'
          : `Error ${res.status}`,
      );
    } catch {
      setMessage('No hay conexión con el backend.');
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className='flex max-w-sm flex-col gap-3'>
      <input
        name='email'
        type='email'
        required
        placeholder='email'
        className='border p-2'
      />
      <input
        name='password'
        type='password'
        required
        minLength={mode === 'register' ? 12 : 1}
        placeholder='contraseña'
        className='border p-2'
      />
      <button disabled={pending} className='border p-2'>
        {mode === 'login' ? 'Entrar' : 'Crear cuenta'}
      </button>
      {message && <p role='status'>{message}</p>}
    </form>
  );
}
