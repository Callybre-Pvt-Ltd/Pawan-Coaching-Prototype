# Environment variables

| Variable | Required | Secret | Description |
| --- | --- | --- | --- |
| `DATABASE_URL` | Yes | Yes | PostgreSQL connection URL. Use the hosted test database outside production. SSL is required when `NODE_ENV` is not `development`. |
| `SESSION_SECRET` | Yes | Yes | High-entropy deployment secret reserved for authentication key material. Never expose to browser code. |
| `APP_ORIGINS` | Yes | No | Comma-separated exact origins permitted to send state-changing requests, such as `https://portal.example.com`. |
| `LOG_LEVEL` | No | No | Structured log threshold; defaults to `info`. |

Use separate values for production, preview, test, and local environments. Never commit `.env.local` or provider credentials. Phone numbers, guardian details, passwords, session tokens, CSRF values, and secrets must not be logged.
