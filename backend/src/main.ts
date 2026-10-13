import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import type { Env } from './config/env.schema.js';

const app = await NestFactory.create(AppModule);
const config = app.get(ConfigService<Env, true>);
app.enableCors({ origin: config.get('FRONTEND_ORIGIN', { infer: true }), credentials: true });
await app.listen(config.get('PORT', { infer: true }));