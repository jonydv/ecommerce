import { NotFoundException } from '@nestjs/common';
import { ProductsService } from './products.service.js';
import type { PrismaService } from '../prisma/prisma.service.js';

const product = (id: string) => ({
  id,
  slug: `p-${id}`,
  name: id,
  description: '',
  priceCents: 1000,
  stock: 1,
  imageUrl: null,
  createdAt: new Date(),
  updatedAt: new Date(),
});
function setup() {
  const prisma = { product: { findMany: vi.fn(), findUnique: vi.fn() } };
  return {
    prisma,
    service: new ProductsService(prisma as unknown as PrismaService),
  };
}

describe('ProductsService', () => {
  it('requests limit + 1 and return nextCursor if there is another page', async () => {
    const { prisma, service } = setup();
    prisma.product.findMany.mockResolvedValue([
      product('a'),
      product('b'),
      product('c'),
    ]);
    const page = await service.list({ limit: 2 });
    expect(prisma.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 3 }),
    );
    expect(page).toMatchObject({
      items: [{ id: 'a' }, { id: 'b' }],
      nextCursor: 'b',
    });
  });
  it('a slug that does not exist throw NotFoundException', async () => {
    const { prisma, service } = setup();
    prisma.product.findUnique.mockResolvedValue(null);
    await expect(service.findBySlug('not-thing')).rejects.toThrow(
      NotFoundException,
    );
  });
});
