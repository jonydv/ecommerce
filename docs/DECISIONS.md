# Decisions

Short decision records, one section per step that decides something, newest at the bottom.
Each one says what was decided, why, and what it costs. If a later step reverses a decision,
it gets a new entry that says so; old entries are never rewritten.

## E0-01 — Two folders, no monorepo

- **Decision:** `backend/` (NestJS) and `frontend/` (Next.js) live side by side in one repo, each
  with its own `package.json`, lockfile and generator defaults. No root `package.json`, no
  workspaces, no shared packages. npm, the package manager that ships with Node.
- **Why:** a warm-up to see the full request path once, fast, with zero new tools.
- **Trade-off:** types are copied by hand between the apps, and each app is installed, linted
  and run on its own. Feria uses a pnpm + Turborepo monorepo with a shared contracts package.

## E0-02 — NestJS backend on port 3001

- **Decision:** NestJS 12 from the official CLI (ESM, Vitest, oxlint), environment validated at boot
  with a Zod schema in `src/config/env.schema.ts`, CORS limited to `FRONTEND_ORIGIN` with credentials.
- **Why:** fail fast on bad config; the browser will call the API directly for auth in E2.
- **Trade-off:** the health type is duplicated in the frontend by hand (no shared package by design).

## E0-03 — Next.js frontend, server-side calls to the API

- **Decision:** Next.js 16 App Router (TypeScript, Tailwind, ESLint as generated). The home page is
  an async Server Component that calls the API through the server-only `API_URL`, with `no-store`.
- **Why:** no API URL in the client bundle, no CORS for data reads, and the build never needs the API.
- **Trade-off:** `HealthResponse` is copied by hand from the backend and trusted with `as`; a renamed
  field breaks at runtime, not at compile time. Accepted for the warm-up; Feria shares Zod contracts.

## E0-04 — PostgreSQL 18 in Docker Compose

- **Decision:** one Compose service, `db` (`postgres:18-alpine`), published on host port 5433, with a
  named volume at `/var/lib/postgresql` and a TCP `pg_isready` healthcheck. The apps run on the host.
- **Why:** native hot reload and debugging on Windows; 5433 avoids the lab container that owns 5432.
- **Trade-off:** local runs don't exercise a production image yet. No Redis until the cart (E4).

## E0-05 — CI with one job per app

- **Decision:** GitHub Actions workflow `ci` with two parallel jobs, `backend` (npm ci, lint, build,
  test) and `frontend` (npm ci, lint, build), Node from `.nvmrc`, npm cache keyed on each lockfile.
- **Why:** CI runs the same commands as local development; independent jobs keep failures readable.
- **Trade-off:** no branch protection yet (single developer). Milestones are annotated tags
  (`starter-v0`, `starter-v1`, …).

## E1-01 — Prisma 7 and the Product model

- **Decision:** Prisma 7.10.0 pinned exactly (CLI and client), driver adapter `@prisma/adapter-pg`,
  prices stored as integer cents, generated client git-ignored and rebuilt on `postinstall`.
- **Why:** the CLI's `latest` tag is an 8.0 release candidate; floats can't represent money exactly.
- **Trade-off:** services use `PrismaService` directly, without a repository port. Fine for a
  single-seller warm-up; Feria puts the ORM behind a port.

## E1-02 — Products, end to end

- **Decision:** `GET /products` uses cursor pagination (`limit` 1–50, `cursor` uuid, fetch limit+1).
  Global `ValidationPipe` with `whitelist` and `transform`, class-validator DTOs. Prices travel as
  integer cents; the frontend formats them with `Intl.NumberFormat('es-AR', ARS)`.
- **Why:** offset pagination slows down and skips rows under writes; formatting is presentation.
- **Debt:** `Product` is copied by hand into `frontend/src/lib/types.ts`. A renamed field breaks at
  runtime, not at compile time. Feria solves this with a shared contracts package.

## E1-03 — One error contract, request ids

- **Decision:** a global `@Catch()` filter returns `{ statusCode, error, message, path, requestId,
timestamp }` for every error. `HttpException`s keep their message; Prisma `P2002` → 409,
  `P2025` → 404; anything else is a generic 500 and the stack only goes to the logs.
- **Why:** one parser on the client; no internals leaked; every response carries `x-request-id`.
- **Fixes:** the earlier draft returned `exception.message` for everything, leaking internals on 500s.

## E1-04 — Health checks and tests

- **Decision:** `@nestjs/terminus` 12.1.0 with `HealthIndicatorService`: `/health/live` has no
  dependencies, `/health/ready` runs `SELECT 1` with a 1 s timeout. Unit tests mock `PrismaService`;
  the e2e suite runs against a real Postgres (`ecommerce_test` locally, a `services:` container in CI).
- **Why:** a database check in liveness turns a DB hiccup into a restart storm; mocks can't catch SQL bugs.
- **Trade-off:** the test database is shared between runs; Feria uses Testcontainers instead.

## E2-01 — Users and password hashing

- **Decision:** Argon2id (19 MiB, t=2, p=1). Emails stored normalized with a plain unique
  constraint. Registration always answers 202. Admins come from the seed only.
- **Why:** Prisma can't declare an index on `lower(email)`; a 409 would enumerate users.
- **Cost:** uniqueness depends on every write path calling `normalizeEmail`.

## E2-02 — Login and session cookie

- **Decision:** 1-day HS256 JWT (`@nestjs/jwt`) in an HttpOnly, SameSite=Lax `session` cookie; own guard.
- **Rejected:** Passport (hides the mechanics); `@nestjs/authentication` (0.0.1); `jose` (less common in Nest).
- **Known limitation:** no refresh token, so a copied token can't be revoked before it expires.

## E2-03 — Next.js with a Nest-owned session

- **Decision:** browser → Nest directly for login/logout (`credentials: 'include'`); Server Components
  forward only the `session` cookie to `/auth/me` and redirect on 401. No `proxy.ts`.
- **Cost:** every Server Component that needs the user forwards the cookie by hand.
- **Production:** vercel.app + onrender.com would make it third-party; E9 uses app./api. subdomains.

## E2 — Authentication: the API owns the session

**Context.** Next.js is the first frontend; an Angular frontend comes later (E10) and must reuse
authentication without rewriting it. Warm-up project: one developer, no identity provider.

**Decision.**

- NestJS owns the session: Argon2id hashing, login, a one-day HS256 JWT in an `HttpOnly`,
  `SameSite=Lax`, `Path=/` cookie (`Secure` in production). Roles via `@Roles()` + `RolesGuard`.
- Development: the browser calls Nest directly for login/logout (`credentials: 'include'`, CORS with
  an explicit origin and `credentials: true`). localhost:3000 and :3001 are the same site.
- Server Components read the cookie with `cookies()` and forward it in the `Cookie` header.
- Production (E9): one owned domain, `app.` and `api.` subdomains, so the cookie stays first-party.

**Alternatives rejected.**

- _Next.js owns the session (Auth.js as a BFF):_ solid, but ties the session to Next; Angular
  could not reuse it without going through Next.
- _JWT in `localStorage` + `Authorization` header:_ any XSS can export the token.
- _Next.js proxies every API call:_ works and avoids CORS, but hides credentialed CORS, which
  is the thing to learn here, and Angular would need its own proxy.

**Consequences.**

- (+) Any browser client on the same site gets auth for free; the API is testable with curl.
- (−) Every Server Component that needs the user forwards the cookie by hand.
- (−) No refresh token: a copied token can't be revoked, and role changes apply on expiry (≤ 1 day).
- (−) Production needs an owned domain, which costs money; vercel.app + onrender.com won't work.

**Revisit when.** E10 connects Angular (this decision's test); revocation or "log out everywhere"
becomes a requirement (move to an opaque, rotating refresh token, as in B3); `@nestjs/authentication`
reaches 1.0; or a frontend must live on a different site.

## E2-05 — Sign-in with Google

- **Decision:** OpenID Connect, authorization code flow with PKCE, run by the API (`openid-client`). `/auth/google`
  stores state, nonce and the PKCE verifier in a signed, 10-minute, HttpOnly cookie scoped to `/auth/google`;
  the callback validates the ID token and issues the same session cookie as the password login. External accounts
  live in `auth_identities`, unique on (provider, subject). Auto-link by email only when Google says
  `email_verified`, and the first link clears the unverified local password (account pre-hijacking).
  `returnTo` only accepts paths of our own front.
- **Why:** the API owns the session (E2), so Next and Angular get Google sign-in with no extra code. `sub` is
  Google's stable identifier; emails can change.
- **Not done:** email verification for password signups; linking a second provider from the account page; showing
  the Google name or picture.
- **Revisit when:** a second provider arrives (Apple, GitHub: same table, another `AuthProvider`); signups get email
  verification (then linking no longer needs to drop the password); or Angular needs Google redirects to its own
  origin (today they return to `FRONTEND_ORIGIN`).

## E3-00 — A feature-based frontend, and English routes

- **Decision:** `src/app/` holds routes only (pages, layouts, and `_components/` for the root layout's
  pieces). `src/features/<domain>/` holds everything about one domain: `api.ts` (server-only reads),
  `actions.ts` (Server Actions), `types.ts` (copied by hand from the backend, one file per domain) and
  `components/`. `src/shared/` holds what belongs to no domain: the HTTP client, the `ApiError` contract,
  `PUBLIC_API_URL`, money formatting. Dependencies point one way (app → features → shared), enforced by
  `no-restricted-imports` in ESLint. No barrel files: deep imports only. Routes and query params in
  English (`/account`, `/products/[slug]`, `?category=`); UI copy in Spanish.
- **Cost:** more folders for a small app, and long imports. A feature may import another feature
  (the cart uses the catalog's `Product`), and the lint rule doesn't catch cycles between features.
- **Revisit:** when types come from a shared contract (Feria), `features/*/types.ts` become generated.
