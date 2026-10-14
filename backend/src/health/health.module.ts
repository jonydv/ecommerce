import { Module } from '@nestjs/common';
import { HealthController } from './health.controller.js';
import { TerminusModule } from '@nestjs/terminus';
import { DbHealthIndicator } from './db.health.js';

@Module({
  imports: [TerminusModule],
  controllers: [HealthController],
  providers: [DbHealthIndicator],
})
export class HealthModule {}
