import Link from 'next/link';
import { AuthForm } from './auth-form';

export default function LoginPage() {
  return (
    <main className='p-8'>
      <h1 className='mb-4 text-2xl'>Entrar</h1>
      <AuthForm mode='login' />
      <p className='mt-4'>
        ¿No tenés cuenta? <Link href='/registro'>Creá una</Link>
      </p>
    </main>
  );
}
