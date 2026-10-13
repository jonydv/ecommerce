'use client';

export default function Error({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <main className='mx-auto flex w-full max-w-xl flex-col items-center gap-4 px-6 py-24 text-center'>
      <h1 className='text-2xl font-semibold'>No pudimos cargar la tienda</h1>
      <p className='text-zinc-500'>Probá de nuevo en unos segundos.</p>
      {error.digest && (
        <p className='font-mono text-xs text-zinc-400'>
          Código de error: {error.digest}
        </p>
      )}
      <button
        onClick={() => retry()}
        className='rounded-lg bg-zinc-900 px-4 py-2 text-sm text-white'
      >
        Reintentar
      </button>
    </main>
  );
}
