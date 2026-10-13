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
