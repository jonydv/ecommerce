import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { AuthGuard } from './auth.guard.js';
import type { Env } from '../config/env.schema.js';

@Module({
  imports: [
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (cfg: ConfigService<Env, true>) => ({
        secret: cfg.get('JWT_SECRET', { infer: true }),
        signOptions: { algorithm: 'HS256', expiresIn: '1d' },
        verifyOptions: { algorithms: ['HS256'] }, // you pick the algorithm, not the token's header
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, AuthGuard],
  exports: [AuthGuard, JwtModule], // E2-04's AdminModule reuses both
})
export class AuthModule {}
