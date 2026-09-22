# Operations guide

## Database migrations

1. Change `src/db/schema.ts`.
2. Generate SQL with `pnpm db:generate`.
3. Review the SQL and Drizzle snapshot in the same change.
4. Apply it to the hosted test database with `pnpm db:migrate`.
5. Run the quality gate.
6. Before a production deployment, apply the same committed SQL migration manually to production.

Schema push is not part of the production workflow. Backups and restoration remain the database provider's responsibility.

## Account provisioning

Run `pnpm provision` in an interactive terminal. The CLI provisions Admin, Tutor, and Student accounts through the same password hashing and domain functions used by the application. Additional Admin creation is intentionally CLI-only. The first Admin must complete Center Settings after signing in.

## Test data

Automated test fixtures must have a unique run namespace. Cleanup may delete only records carrying that namespace; it must never truncate shared tables or clean production data.

## Vercel deployment

1. Configure Node.js 24 and the exact environment variables in Vercel.
2. Attach the production database only to the Production environment.
3. Attach the hosted test database to Preview and CI environments.
4. Apply reviewed migrations before the corresponding application release.
5. Run `pnpm check` and the full Playwright matrix.
6. Deploy only after the supplied logo and approved landing copy replace placeholders.

OpenAPI is available at `/api/openapi` only outside production. The checked-in `docs/openapi.json` is validated for drift in CI.
