# ADR 0004: Manual production migrations

## Status

Accepted.

## Decision

Generate and review SQL migrations with Drizzle, commit them with the application, and apply them as an explicit release step before production deployment. The application build and startup commands never perform schema push or migration automatically.

## Consequences

Deployments remain predictable and reviewable, while operators must coordinate the database release and application release deliberately.
