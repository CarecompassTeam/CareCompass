# Backend

## Responsibility

The backend contains API routes, request handling, business logic, data access, middleware, and server configuration.

## Structure

- `src/config/` — Application configuration.
- `src/routes/` — API route definitions.
- `src/controllers/` — Request and response handling.
- `src/services/` — Business logic and integrations.
- `src/models/` — Data models, if applicable to the chosen database approach.
- `src/middleware/` — Shared request middleware.
- `src/utils/` — Shared backend utilities.
- `tests/` — Backend tests.

## Development Guidelines

- Validate incoming requests.
- Keep secrets in local environment variables.
- Keep route handlers focused and move reusable business logic into services.
- Coordinate API contracts with frontend and AI teammates.

Setup and test commands will be added after dependencies are configured.
