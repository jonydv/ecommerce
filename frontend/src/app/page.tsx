import { getProducts } from '@/lib/api';
import { formatPrice } from '@/lib/money';

export default async function Home() {
  const { items } = await getProducts(12);
  return (
    <main className='mx-auto w-full max-w-6xl px-6 py-12'>
      <h1 className='mb-8 text-3xl font-semibold tracking-tight'>Productos</h1>
      {items.length === 0 && (
        <p className='text-zinc-500'>No hay productos. ¿Corriste el seed?</p>
      )}
      <ul className='grid gap-6 sm:grid-cols-2 lg:grid-cols-3'>
        {items.map((p) => (
          <li
            key={p.id}
            className='flex flex-col rounded-xl border border-zinc-200 p-5 dark:border-zinc-800'
          >
            <h2 className='text-lg font-medium'>{p.name}</h2>
            <p className='mt-1 flex-1 text-sm text-zinc-500'>{p.description}</p>
            <div className='mt-4 flex items-baseline justify-between'>
              <span className='text-xl font-semibold'>
                {formatPrice(p.priceCents)}
              </span>
              <span className='text-xs text-zinc-500'>
                {p.stock > 0 ? `${p.stock} en stock` : 'Sin stock'}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
