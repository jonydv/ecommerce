import { Controller, Get, Logger, Query, Req, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { CookieOptions, Request, Response } from 'express';
import type { Env } from '../../config/env.schema.js';
import { frontUrl } from '../../config/front-url.js';
import { AuthService } from '../auth.service.js';
import { SESSION_COOKIE, sessionCookieOptions } from '../session.js';
import {
  GoogleAccountsService,
  GoogleSignInError,
} from './google-accounts.service.js';
import { GoogleOidc, type OAuthFlow } from './google-oidc.js';
import { safeReturnTo } from './safe-return-to.js';

const FLOW_COOKIE = 'google_flow';
const flowCookieOptions: CookieOptions = {
  httpOnly: true,
  sameSite: 'lax', // Lax DOES travel on the top-level GET that comes back from accounts.google.com
  secure: process.env.NODE_ENV === 'production',
  path: '/auth/google', // only these two routes ever see it
  maxAge: 10 * 60 * 1000, // ten minutes to choose an account
};

// E2-05 · the two routes of "Continuar con Google". The browser NAVIGATES here (a link, not fetch):
// Google's screen can't live inside a fetch, and the redirects carry the cookies.
@Controller('auth/google')
export class GoogleAuthController {
  private readonly logger = new Logger(GoogleAuthController.name);

  constructor(
    private readonly google: GoogleOidc,
    private readonly accounts: GoogleAccountsService,
    private readonly auth: AuthService,
    private readonly jwt: JwtService,
    private readonly env: ConfigService<Env, true>,
  ) {}

  // GET /auth/google?returnTo=/cuenta → 302 to Google, with the flow's secrets in a signed cookie
  @Get()
  async start(@Query('returnTo') returnTo: unknown, @Res() res: Response) {
    if (!this.google.enabled)
      return res.redirect(this.front('/login?error=google_unavailable'));
    try {
      const { url, flow } = await this.google.start(safeReturnTo(returnTo));
      res.cookie(
        FLOW_COOKIE,
        await this.jwt.signAsync(flow, this.flowJwt()),
        flowCookieOptions,
      );
      return res.redirect(url.href);
    } catch (e) {
      this.logger.error(
        `google sign-in could not start: ${(e as Error).message}`,
      );
      return res.redirect(this.front('/login?error=google_failed'));
    }
  }

  // GET /auth/google/callback?code&state → our session cookie → 302 back to the front
  @Get('callback')
  async callback(@Req() req: Request, @Res() res: Response) {
    const raw: unknown = req.cookies?.[FLOW_COOKIE];
    res.clearCookie(FLOW_COOKIE, flowCookieOptions); // single use, whatever happens next
    if (req.query.error === 'access_denied')
      return res.redirect(this.front('/login?error=google_cancelled'));
    try {
      if (typeof raw !== 'string')
        throw new Error(
          'no flow cookie: expired, or the callback came from another browser',
        );
      const flow = await this.jwt.verifyAsync<OAuthFlow>(raw, this.flowJwt());
      // The URL Google called, rebuilt on the REGISTERED redirect URI: behind a proxy, req.protocol can lie
      const callbackUrl = new URL(
        req.originalUrl,
        this.env.get('GOOGLE_REDIRECT_URI', { infer: true }),
      );
      const user = await this.accounts.signIn(
        await this.google.finish(callbackUrl, flow),
      );
      res.cookie(
        SESSION_COOKIE,
        await this.auth.sessionFor(user),
        sessionCookieOptions,
      ); // the SAME cookie as E2-02
      return res.redirect(this.front(flow.returnTo));
    } catch (e) {
      const reason =
        e instanceof GoogleSignInError ? e.reason : 'google_failed';
      this.logger.warn(
        `google sign-in failed (${reason}): ${(e as Error).message}`,
      );
      return res.redirect(this.front(`/login?error=${reason}`));
    }
  }

  private front(path: string): string {
    return frontUrl(this.env, path);
  }

  // The flow cookie is a JWT signed with ANOTHER secret: it can never pass as a session token, nor the other way round
  private flowJwt() {
    return {
      secret: `${this.env.get('JWT_SECRET', { infer: true })}:google-flow`,
      expiresIn: '10m' as const,
    };
  }
}
