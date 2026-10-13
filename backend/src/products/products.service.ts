import { Injectable, NotFoundException } from '@nestjs/common';
import { Product } from '../generated/prisma/client.js';
import type { ListProductsQuery } from './dto/list-products.query.js';
import {PrismaService} from '../prisma/prisma.service.js'

export type ProductPage = {items: Product[], nextCursor: string | null};

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

async list({limit, cursor}: ListProductsQuery): Promise<ProductPage>{
    const rows = await this.prisma.product.findMany({orderBy: [{createdAt: 'desc'}, {id: 'desc'}], // The id is a tie-breaker
    take: limit + 1, // we fetch one more to see if there is a next page
    ...(cursor ? {cursor: {id: cursor}, skip: 1}: {})
    });
    const items = rows.slice(0, limit);
    const nextCursor = rows.length > limit ? items[items.length - 1].id : null;
    return {items, nextCursor};
}
async findBySlug(slug: string): Promise<Product>{
    const product = await this.prisma.product.findUnique({where: {slug}});
    if(!product) throw new NotFoundException(`Product "${slug}" not found`);
    return product;
}
}
