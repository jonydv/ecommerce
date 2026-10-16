import { execSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Events, OAuth2Server } from 'oauth2-mock-server';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { hashPassword } from '../src/auth/credentials.js';
import { configureApp } from '../src/configure-app.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

// E2-05 · a fake Google on localhost:4011 (GOOGLE_ISSUER in vitest.config.e2e.ts): a real OpenID Connect server
// with discovery, keys, PKCE and signed ID tokens. It says yes at once; we choose who "logged in".
const google = new OAuth2Server();
let profile: Record<string, unknown> = {};
let app: INestApplication;
let prisma: PrismaService;

beforeAll(async () => {
  await google.issuer.keys.generate('RS256');
  await google.start(4011, 'localhost');
  google.service.on(Events.BeforeTokenSigning, (token) =>
    Object.assign(token.payload, profile),
  );
  execSync('npx prisma migrate deploy', { stdio: 'inherit' });
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();
  app = configureApp(moduleRef.createNestApplication());
  await app.init();
  prisma = app.get(PrismaService);
}, 60_000);
afterAll(async () => {
  await app?.close();
  await google.stop();
});

const http = () => request(app.getHttpServer());
const cookie = (res: request.Response, name: string) =>
  ([] as string[])
    .concat(res.headers['set-cookie'] ?? [])
    .find((c) => c.startsWith(`${name}=`))
    ?.split(';')[0];
const newGoogleUser = (over: Record<string, unknown> = {}) => ({
  sub: randomUUID(),
  email: `${randomUUID()}@gmail.test`,
  email_verified: true,
  ...over,
});

// What the browser does: our API → Google → our callback. Returns where the callback sends it, and the session.
async function signInWithGoogle(
  who: Record<string, unknown>,
  opts: {
    returnTo?: string;
    tamper?: (u: URL) => void;
    noFlowCookie?: boolean;
  } = {},
) {
  profile = who;
  const start = await http()
    .get(
      `/auth/google${opts.returnTo ? `?returnTo=${encodeURIComponent(opts.returnTo)}` : ''}`,
    )
    .expect(302);
  const flow = cookie(start, 'google_flow');
  const atGoogle = await fetch(start.headers.location, { redirect: 'manual' }); // Google answers: back to the callback
  const back = new URL(atGoogle.headers.get('location')!);
  opts.tamper?.(back);
  const callback = http().get(back.pathname + back.search);
  if (flow && !opts.noFlowCookie) void callback.set('Cookie', flow);
  const res = await callback.expect(302);
  return {
    start,
    location: res.headers.location as string,
    session: cookie(res, 'session'),
  };
}

it('the first redirect goes to Google with PKCE, state and nonce, and leaves a short-lived cookie', async () => {
  const res = await http().get('/auth/google').expect(302);
  const to = new URL(res.headers.location);
  expect(to.origin).toBe('http://localhost:4011');
  expect(to.searchParams.get('code_challenge_method')).toBe('S256');
  expect(to.searchParams.get('redirect_uri')).toBe(
    'http://localhost:3001/auth/google/callback',
  );
  for (const p of ['code_challenge', 'state', 'nonce'])
    expect(to.searchParams.get(p)).toBeTruthy();
  expect(res.headers['set-cookie'][0]).toMatch(
    /^google_flow=.+; Max-Age=600; Path=\/auth\/google; .*HttpOnly; SameSite=Lax/,
  );
});

it('a new customer: an account without a password, and the same session cookie as a normal login', async () => {
  const who = newGoogleUser();
  const { location, session } = await signInWithGoogle(who, {
    returnTo: '/carrito',
  });
  expect(location).toBe('http://localhost:3000/carrito');
  const me = await http().get('/auth/me').set('Cookie', session!).expect(200);
  expect(me.body).toMatchObject({ email: who.email, role: 'CUSTOMER' });
  const user = await prisma.user.findUniqueOrThrow({
    where: { email: who.email as string },
    include: { identities: true },
  });
  expect(user.passwordHash).toBeNull();
  expect(user.identities).toMatchObject([
    { provider: 'GOOGLE', subject: who.sub },
  ]);
});

it('the same Google account again is the same user, even if its email changed (sub is the key)', async () => {
  const who = newGoogleUser();
  await signInWithGoogle(who);
  const { session } = await signInWithGoogle({
    ...who,
    email: `${randomUUID()}@gmail.test`,
  });
  const me = await http().get('/auth/me').set('Cookie', session!).expect(200);
  expect(me.body.email).toBe(who.email);
  expect(
    await prisma.authIdentity.count({ where: { subject: who.sub as string } }),
  ).toBe(1);
});

it('an email registered with a password gets Google linked, and that unproven password stops working', async () => {
  const email = `${randomUUID()}@gmail.test`;
  await prisma.user.create({
    data: {
      email,
      passwordHash: await hashPassword('la-clave-del-que-se-adelanto'),
    },
  });
  const { session } = await signInWithGoogle(newGoogleUser({ email }));
  expect(session).toBeDefined();
  await http()
    .post('/auth/login')
    .send({ email, password: 'la-clave-del-que-se-adelanto' })
    .expect(401);
  const user = await prisma.user.findUniqueOrThrow({ where: { email } });
  expect(user.emailVerifiedAt).not.toBeNull();
});

it('a Google email that Google itself did not verify does not get in', async () => {
  const who = newGoogleUser({ email_verified: false });
  const { location, session } = await signInWithGoogle(who);
  expect(location).toBe('http://localhost:3000/login?error=email_not_verified');
  expect(session).toBeUndefined();
  expect(
    await prisma.user.count({ where: { email: who.email as string } }),
  ).toBe(0);
});

it('login CSRF: a callback without the flow cookie (another browser) never starts a session', async () => {
  const { location, session } = await signInWithGoogle(newGoogleUser(), {
    noFlowCookie: true,
  });
  expect(location).toBe('http://localhost:3000/login?error=google_failed');
  expect(session).toBeUndefined();
});

it('a tampered state is refused', async () => {
  const { location, session } = await signInWithGoogle(newGoogleUser(), {
    tamper: (u) => u.searchParams.set('state', 'forged'),
  });
  expect(location).toBe('http://localhost:3000/login?error=google_failed');
  expect(session).toBeUndefined();
});

it('returnTo pointing to another site lands on /account (no open redirect)', async () => {
  const { location } = await signInWithGoogle(newGoogleUser(), {
    returnTo: '//evil.example/phish',
  });
  expect(location).toBe('http://localhost:3000/account');
});

it('cancelling at Google goes back to the login with the reason', async () => {
  const res = await http()
    .get('/auth/google/callback?error=access_denied&state=x')
    .expect(302);
  expect(res.headers.location).toBe(
    'http://localhost:3000/login?error=google_cancelled',
  );
});

it('a Google-only user gets the same 401 as anyone with a wrong password', async () => {
  const who = newGoogleUser();
  await signInWithGoogle(who);
  const res = await http()
    .post('/auth/login')
    .send({ email: who.email, password: 'cualquier-cosa-larga' })
    .expect(401);
  expect(res.body.message).toBe('invalid credentials');
});
