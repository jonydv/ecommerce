import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as client from 'openid-client';
import type { Env } from '../../config/env.schema.js';
import { normalizeEmail } from '../credentials.js';

// E2-05 · what the browser carries between "go to Google" and "back from Google" (in a short-lived cookie).
export type OAuthFlow = {
  state: string;
  nonce: string;
  verifier: string;
  returnTo: string;
};
export type GoogleProfile = {
  subject: string;
  email: string;
  emailVerified: boolean;
};

// The OpenID Connect client: Authorization Code + PKCE, with state and nonce. Everything Google-specific is here.
@Injectable()
export class GoogleOidc {
  private config?: Promise<client.Configuration>;

  constructor(private readonly env: ConfigService<Env, true>) {}

  get enabled(): boolean {
    return Boolean(
      this.env.get('GOOGLE_CLIENT_ID', { infer: true }) &&
      this.env.get('GOOGLE_CLIENT_SECRET', { infer: true }),
    );
  }

  // Discovery reads https://accounts.google.com/.well-known/openid-configuration ONCE, on the first sign-in
  // (not at boot: if Google is slow, the API still starts). If it fails, the next sign-in tries again.
  private configuration(): Promise<client.Configuration> {
    const issuer = new URL(this.env.get('GOOGLE_ISSUER', { infer: true }));
    // http is only for the local fake of the tests. Google itself is always https.
    const local =
      issuer.hostname === 'localhost' &&
      this.env.get('NODE_ENV', { infer: true }) !== 'production';
    this.config ??= client
      .discovery(
        issuer,
        this.env.get('GOOGLE_CLIENT_ID', { infer: true })!,
        this.env.get('GOOGLE_CLIENT_SECRET', { infer: true })!,
        undefined,
        local ? { execute: [client.allowInsecureRequests] } : undefined,
      )
      .catch((e: unknown) => {
        this.config = undefined;
        throw e;
      });
    return this.config;
  }

  // Step 1 · the URL of Google's consent screen, and the secrets that must come back with the user.
  async start(returnTo: string): Promise<{ url: URL; flow: OAuthFlow }> {
    const config = await this.configuration();
    const flow: OAuthFlow = {
      state: client.randomState(), // ties the callback to THIS browser: stops "login CSRF"
      nonce: client.randomNonce(), // ties the ID token to THIS request: stops replaying an old token
      verifier: client.randomPKCECodeVerifier(), // PKCE: a stolen code is useless without it
      returnTo,
    };
    const url = client.buildAuthorizationUrl(config, {
      redirect_uri: this.env.get('GOOGLE_REDIRECT_URI', { infer: true }),
      scope: 'openid email profile',
      code_challenge: await client.calculatePKCECodeChallenge(flow.verifier),
      code_challenge_method: 'S256',
      state: flow.state,
      nonce: flow.nonce,
      prompt: 'select_account', // always show the account chooser: shared computers, several accounts
    });
    return { url, flow };
  }

  // Step 2 · Google sent the user back with ?code&state. Swap the code for tokens (server to server, with the
  // client secret and the PKCE verifier) and read the ID token. openid-client checks its signature, issuer,
  // audience, expiry, state and nonce: if anything is off, it throws.
  async finish(callbackUrl: URL, flow: OAuthFlow): Promise<GoogleProfile> {
    const tokens = await client.authorizationCodeGrant(
      await this.configuration(),
      callbackUrl,
      {
        pkceCodeVerifier: flow.verifier,
        expectedState: flow.state,
        expectedNonce: flow.nonce,
      },
    );
    const claims = tokens.claims()!; // with expectedNonce, an ID token is mandatory
    return {
      subject: claims.sub,
      email: normalizeEmail(
        typeof claims.email === 'string' ? claims.email : '',
      ),
      emailVerified: claims.email_verified === true,
    };
  }
}
