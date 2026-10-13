import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import type { Env } from './config/env.schema.js';
import { configureApp } from './configure-app.js';
import { ConsoleLogger } from '@nestjs/common';

const app = await NestFactory.create(AppModule, { logger: new ConsoleLogger({ json: process.env.NODE_ENV === 'production' }) });
const config = app.get(ConfigService<Env, true>);
app.enableCors({ origin: config.get('FRONTEND_ORIGIN', { infer: true }), credentials: true });
configureApp(app);
await app.listen(config.get('PORT', { infer: true }));