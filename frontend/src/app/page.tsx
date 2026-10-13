import { getHealth } from '@/lib/api';

export default async function Home() {
  const health = await getHealth();

  return (
    <main className='mx-auto w-full max-w-xl px-6 py-16'>
      <h1 className='text-3xl font-semibold tracking-tight'>Tienda</h1>
      {health ? (
        <p className='mt-6 rounded-lg border border-green-600 p-4'>
          Backend: <strong>{health.status}</strong> · arriba hace{' '}
          {health.uptime} s
        </p>
      ) : (
        <p className='mt-6 rounded-lg border border-red-600 p-4'>
          Backend caído: ¿está corriendo <code>npm run start:dev</code> en{' '}
          <code>backend/</code>?
        </p>
      )}
    </main>
  );
}
