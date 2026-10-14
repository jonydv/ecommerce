import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client.js';
import { hashPassword, normalizeEmail } from '../src/auth/credentials.js';
import { Role } from '../src/generated/prisma/enums.js';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

const products = [
  {
    name: 'Yerba mate suave 1 kg',
    slug: 'yerba-mate-suave-1kg',
    priceCents: 489900,
    stock: 40,
    description: 'Yerba con palo, molienda tradicional, estacionada 12 meses.',
  },
  {
    name: 'Mate de calabaza forrado',
    slug: 'mate-calabaza-forrado',
    priceCents: 1850000,
    stock: 15,
    description: 'Calabaza curada a mano, forrada en cuero vacuno.',
  },
  {
    name: 'Bombilla de alpaca',
    slug: 'bombilla-alpaca',
    priceCents: 1290000,
    stock: 25,
    description: 'Bombilla pico de loro, filtro desarmable.',
  },
  {
    name: 'Termo acero 1 litro',
    slug: 'termo-acero-1l',
    priceCents: 6499900,
    stock: 10,
    description: 'Doble pared, mantiene el agua caliente 24 horas.',
  },
  {
    name: 'Dulce de leche repostero 400 g',
    slug: 'dulce-de-leche-repostero-400g',
    priceCents: 329900,
    stock: 60,
    description: 'Textura firme, ideal para alfajores y rellenos.',
  },
  {
    name: 'Alfajores de maicena x 12',
    slug: 'alfajores-maicena-x12',
    priceCents: 899900,
    stock: 30,
    description: 'Caja de doce, con coco rallado en el borde.',
  },
  {
    name: 'Taza de cerámica esmaltada',
    slug: 'taza-ceramica-esmaltada',
    priceCents: 1150000,
    stock: 20,
    description: 'Hecha a mano, 350 ml, apta lavavajillas.',
  },
  {
    name: 'Café en grano 500 g',
    slug: 'cafe-en-grano-500g',
    priceCents: 1599900,
    stock: 35,
    description: 'Tostado medio, origen Colombia.',
  },
  {
    name: 'Prensa francesa 600 ml',
    slug: 'prensa-francesa-600ml',
    priceCents: 2899900,
    stock: 12,
    description: 'Vidrio borosilicato y filtro de acero inoxidable.',
  },
  {
    name: 'Mantel de lino 1,5 m',
    slug: 'mantel-lino-150',
    priceCents: 3450000,
    stock: 8,
    description: 'Lino lavado, color arena.',
  },
  {
    name: 'Tabla de algarrobo',
    slug: 'tabla-algarrobo',
    priceCents: 2290000,
    stock: 18,
    description: 'Para picadas, 40 x 25 cm, terminación con aceite.',
  },
  {
    name: 'Set de 4 vasos de vidrio',
    slug: 'set-4-vasos-vidrio',
    priceCents: 1399900,
    stock: 22,
    description: 'Vidrio soplado, 300 ml cada uno.',
  },
];

for (const p of products)
  await prisma.product.upsert({
    where: { slug: p.slug },
    update: p,
    create: p,
  });
console.log(`Seeded ${products.length} products`);

const adminEmail = normalizeEmail(process.env.SEED_ADMIN_EMAIL!);
await prisma.user.upsert({
  where: { email: adminEmail },
  update: { role: Role.ADMIN }, // re-seeding never resets the password
  create: {
    email: adminEmail,
    role: Role.ADMIN,
    passwordHash: await hashPassword(process.env.SEED_ADMIN_PASSWORD!),
  },
});
console.log(`admin ready: ${adminEmail}`);

await prisma.$disconnect();
