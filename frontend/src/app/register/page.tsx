import Link from 'next/link';
import { AuthForm } from '../login/auth-form';
import { GoogleButton } from '../login/google-button';

export default function RegisterPage() {
  return (
    <main className='p-8'>
      <h1 className='mb-4 text-2xl'>Crear cuenta</h1>
      <GoogleButton />{' '}
      {/* E2-05: with Google, registering and entering are the same click */}
      <p className='my-4 max-w-sm text-center text-sm text-zinc-500'>
        o con tu email
      </p>
      <AuthForm mode='register' />
      <p className='mt-4'>
        <Link href='/login'>Ya tengo cuenta</Link>
      </p>
    </main>
  );
}
