import { Controller, Get } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckService,
  HealthIndicatorService,
} from '@nestjs/terminus';
import { DbHealthIndicator } from './db.health.js';

@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly indicator: HealthIndicatorService,
    private readonly db: DbHealthIndicator,
  ) {}

  @Get('live')
  @HealthCheck() // ZERO dependencies. If it fails: restart me
  live() {
    return this.health.check([
      () =>
        this.indicator
          .check('app')
          .up({ uptimeSeconds: Math.round(process.uptime()) }),
    ]);
  }

  @Get('ready')
  @HealthCheck() // the database. If it fails: do not send me traffic
  ready() {
    return this.health.check([() => this.db.check('db')]);
  }
}
