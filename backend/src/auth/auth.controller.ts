import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { AuthService } from './auth.service.js';
import { LoginDto, RegisterDto } from './auth.dto.js';
import { AuthGuard } from './auth.guard.js';
import {
  SESSION_COOKIE,
  sessionCookieOptions,
  CurrentUser,
} from './session.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('register')
  @HttpCode(202)
  async register(@Body() dto: RegisterDto) {
    await this.auth.register(dto.email, dto.password);
    return { ok: true }; // same answer wheter the email was new or not
  }

  @Post('login')
  @HttpCode(200)
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    // passthrough: you set the cookie AND Nest still serializes the return value
    res.cookie(
      SESSION_COOKIE,
      await this.auth.login(dto.email, dto.password),
      sessionCookieOptions,
    );
    return { ok: true }; // the token is NOT in the body: JavaScript never sees it
  }
  @Get('me')
  @UseGuards(AuthGuard)
  async me(@CurrentUser('id') userId: string) {
    const user = await this.auth.me(userId);
    if (!user) throw new UnauthorizedException('invalid session'); // valid token, deleted user
    return user;
  }
  @Post('logout')
  @HttpCode(204)
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie(SESSION_COOKIE, sessionCookieOptions); // same path & flags, or it survives
  }
}
