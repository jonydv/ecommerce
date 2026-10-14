import { execSync } from 'node:child_process';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/configure-app.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

const url = process.env.DATABASE_URL ?? '';
if (!new URL(url).pathname.endsWith('_test'))
  throw new Error(`e2e only runs against a *_test database, got ${url}`);
let app: INestApplication;

beforeAll(async () => {
  execSync('npx prisma migrate deploy', { stdio: 'inherit' }); // the git migrations, like in production
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();
  app = configureApp(moduleRef.createNestApplication()); // the same globals as main.ts
  await app.init();
  const prisma = app.get(PrismaService);
  await prisma.product.deleteMany();
  // createMany: the five with the SAME createdAt. A cursor without tie-breaker fails here; a mock, never.
  await prisma.product.createMany({
    data: [1, 2, 3, 4, 5].map((i) => ({
      name: `P${i}`,
      slug: `p-${i}`,
      description: '',
      priceCents: i * 1000,
    })),
  });
}, 60_000);
afterAll(async () => {
  await app?.close();
});

it('page with cursor without repeating or skipping', async () => {
  const get = (q: string) =>
    request(app.getHttpServer()).get(`/products?${q}`).expect(200);
  const p1 = await get('limit=2');
  const p2 = await get(`limit=2&cursor=${p1.body.nextCursor}`);
  const p3 = await get(`limit=2&cursor=${p2.body.nextCursor}`);
  const slugs = [...p1.body.items, ...p2.body.items, ...p3.body.items].map(
    (p: { slug: string }) => p.slug,
  );
  expect(new Set(slugs).size).toBe(5);
  expect(p3.body.nextCursor).toBeNull();
});

it('400 with the error contract and the same requestId as the header', async () => {
  const res = await request(app.getHttpServer())
    .get('/products?limit=999')
    .expect(400);
  expect(res.body).toMatchObject({
    statusCode: 400,
    error: 'Bad Request',
    path: '/products?limit=999',
  });
  expect(res.body.requestId).toBe(res.headers['x-request-id']);
});
