import { Controller, Get, Query, Param } from '@nestjs/common';
import { ProductsService } from './products.service.js';
import { ListProductsQuery } from './dto/list-products.query.js';

@Controller('products')
export class ProductsController {
    constructor(private readonly products: ProductsService){}
        @Get() list(@Query() query: ListProductsQuery){ return this.products.list(query);}
        @Get(':slug') findOne(@Param('slug') slug: string){return this.products.findBySlug(slug)};
    }
