import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service.js';

@Global() // transversal means available everywhere
@Module({
  providers: [PrismaService], exports: [PrismaService]
})
export class PrismaModule {}
