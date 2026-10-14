import { Injectable } from '@nestjs/common';
import { HealthIndicatorService } from '@nestjs/terminus';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class DbHealthIndicator {
  constructor(
    private readonly indicator: HealthIndicatorService,
    private readonly prisma: PrismaService,
  ) {}
  check(key: string) {
    return this.indicator
      .check(key)
      .attempt(async () => {
        await this.prisma.$queryRaw`SELECT 1`;
      }) // if dropped stay down
      .withTimeout(1000); // More than 1 sec is down
  }
}
