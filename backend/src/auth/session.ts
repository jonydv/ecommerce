import type { CookieOptions, Request } from 'express';
import { Role } from '../generated/prisma/enums.js';
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export type JwtPayload = { sub: string; role: Role }; //What travels inside the JWT

export type AuthUser = { id: string; role: Role }; //What the guards hands on the request.

export type AuthedRequest = Request & { user?: AuthUser };
export const SESSION_COOKIE = 'session';

export const sessionCookieOptions: CookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  path: '/', //B3 used /auth because that cookie was the refresh token, this one is the session
  maxAge: 24 * 60 * 60 * 1000, //Express: MILLISECONDS. It writes Max-Age=86400 (seconds) for you
};

// @CurrentUser() / @CurrentUser('id') — the createParamDecorator from 12-nestjs-backend §5
export const CurrentUser = createParamDecorator(
  (field: keyof AuthUser | undefined, ctx: ExecutionContext) => {
    const user = ctx.switchToHttp().getRequest<AuthedRequest>().user;
    return field ? user?.[field] : user;
  },
);
