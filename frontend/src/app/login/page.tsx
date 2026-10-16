import Link from 'next/link';
import { AuthForm } from '@/features/auth/components/auth-form';
import {
  GOOGLE_ERRORS,
  GoogleButton,
} from '@/features/auth/components/google-button';

export default async function LoginPage({ searchParams }: PageProps<'/login'>) {
  const { error } = await searchParams; // E2-05: Nest sends /login?error=… when Google failed
  const googleError =
    typeof error === 'string' ? GOOGLE_ERRORS[error] : undefined;
  return (
    <main className='p-8'>
      <h1 className='mb-4 text-2xl'>Entrar</h1>
      {googleError && (
        <p
          role='alert'
          className='mb-4 max-w-sm border border-red-300 p-2 text-red-800'
        >
          {googleError}
        </p>
      )}
      <GoogleButton />
      <p className='my-4 max-w-sm text-center text-sm text-zinc-500'>
        o con tu email
      </p>
      <AuthForm mode='login' />
      <p className='mt-4'>
        ¿No tenés cuenta? <Link href='/register'>Creá una</Link>
      </p>
    </main>
  );
}
