import { redirect } from 'next/navigation';
import { getMe } from '@/lib/api';
import { LogoutButton } from './logout-button';

export default async function AccountPage() {
  const me = await getMe();
  if (!me) redirect('/login'); // throws; never wrap it in try/catch

  return (
    <main className='flex flex-col gap-4 p-8'>
      <h1 className='text-2xl'>Hola, {me.email}</h1>
      <p>Rol: {me.role}</p>
      <LogoutButton />
    </main>
  );
}
