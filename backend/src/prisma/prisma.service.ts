import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '../generated/prisma/client.js';
import { ConfigService } from '@nestjs/config';
import { Env } from '../config/env.schema.js';
import { PrismaPg } from '@prisma/adapter-pg';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
    constructor(config: ConfigService<Env, true>){
        super({
            adapter: new PrismaPg({connectionString: config.get('DATABASE_URL', {infer: true})})
        })
    }
    async onModuleInit(){
        await this.$connect()
    }
    async onModuleDestroy(){
        await this.$disconnect()
    }
}
