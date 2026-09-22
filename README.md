# Pawan Coaching Management Prototype

Responsive coaching-center operations software for Admins, Tutors, and Students, with a public brand landing page. The application uses Next.js App Router, strict TypeScript, PostgreSQL, Drizzle, custom cookie sessions, and a mobile-first accessible interface.

## Prerequisites

- Node.js 24 LTS
- pnpm 11.7.0
- A hosted PostgreSQL test database for local development, previews, CI, and automated tests

## Local setup

1. Copy `.env.example` to `.env.local` and provide the test database URL.
2. Install exact dependencies with `pnpm install --frozen-lockfile`.
3. Apply committed migrations with `pnpm db:migrate`.
4. Provision the first Admin with `pnpm provision`.
5. Start the application with `pnpm dev` and open `http://localhost:3000`.
6. Sign in and complete the required Center Settings screen.

Do not point local development or automated tests at the production database.

## Commands

| Command | Purpose |
| --- | --- |
| `pnpm dev` | Start the Turbopack development server |
| `pnpm build` | Create the production build |
| `pnpm lint` | Run Biome formatting and lint checks |
| `pnpm typecheck` | Run strict TypeScript checks |
| `pnpm test` | Run Vitest unit/component tests |
| `pnpm test:e2e` | Run Playwright browser and axe checks |
| `pnpm db:generate` | Generate a SQL migration after a schema change |
| `pnpm db:migrate` | Apply committed migrations manually |
| `pnpm provision` | Provision a complete Admin, Tutor, or Student account |
| `pnpm openapi:write` | Regenerate the checked-in OpenAPI document |
| `pnpm check` | Run the local quality gate |

## Architecture and operations

- [Architecture](docs/ARCHITECTURE.md)
- [Environment variables](docs/ENVIRONMENT.md)
- [Migrations, provisioning, and deployment](docs/OPERATIONS.md)
- [Permission matrix](docs/PERMISSIONS.md)
- [OpenAPI contract](docs/openapi.json)
- [Architecture decisions](docs/adr)

## Required external assets

Before visual sign-off and production deployment, provide the transparent high-resolution PNG logo and approved landing-page headline, About, offering, and benefit copy. Production/test database URLs and Vercel secrets are also intentionally not committed.
