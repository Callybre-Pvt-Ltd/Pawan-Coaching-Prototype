# Architecture

The prototype is a single Next.js App Router application deployed to Vercel. PostgreSQL is the source of truth and is accessed through Drizzle ORM and a small pooled `node-postgres` connection.

## Boundaries

- `src/app` owns pages and REST route handlers.
- `src/features` owns domain validation and business workflows.
- `src/db` owns the relational schema and database construction.
- Server-rendered portal layouts perform optimistic role gating; every REST handler repeats secure authorization.
- The browser stores only theme and sidebar preferences. Coaching data and sessions remain in PostgreSQL.

## Request flow

Authenticated writes use an HttpOnly session cookie, a readable double-submit CSRF cookie, an `x-csrf-token` header, and an allowed-origin check. Route handlers validate inputs with Valibot, perform transactions, and return Problem Details on failure.

## Time and money

Event timestamps use PostgreSQL `timestamptz` and are presented in `Asia/Kolkata`. Schedules are local weekly time values. Money is stored as integer paise.
