# ecommerce

Single-seller e-commerce built as a full-stack TypeScript warm-up:
a NestJS API, a Next.js frontend and PostgreSQL in Docker.

| Folder / file        | What           | Port |
| -------------------- | -------------- | ---- |
| `backend/`           | NestJS 12 API  | 3001 |
| `frontend/`          | Next.js 16 app | 3000 |
| `docker-compose.yml` | PostgreSQL 18  | 5433 |

Requirements: Node 24 (see `.nvmrc`) and Docker Desktop.
Each app has its own `package.json`: run `npm install` and `npm run start:dev` (backend)
or `npm run dev` (frontend) inside its folder, one terminal each.

Design decisions: [docs/DECISIONS.md](docs/DECISIONS.md).
