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
