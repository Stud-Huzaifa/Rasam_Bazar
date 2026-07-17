# Final Engineering Quality Checks

Date: 2026-07-17

## Implemented

- Added root scripts for `test:unit`, `test:integration`, and `test:e2e`.
- Added a dependency-free integration runner for the critical backend workflow tests.
- Added Playwright journey specs for customer, vendor, and admin journeys.
- Debounced marketplace filter/search requests to avoid repeated API calls while typing.
- Tightened Docker Compose with restart policies, health checks, environment defaults, PostgreSQL volume usage, and build-time `NEXT_PUBLIC_API_URL` for the Next.js image.

## Passed Locally

- `npm.cmd run typecheck`
- `npm.cmd run lint`
- `npm.cmd run format:check`
- `npm.cmd run test`
- `npm.cmd run test:integration`
- `npm.cmd run build`

## Blocked Locally

- `pnpm ...`: `pnpm` is not installed or available on PATH in this environment.
- `npm.cmd install --save-dev @playwright/test@latest`: failed with `UNABLE_TO_VERIFY_LEAF_SIGNATURE` against `https://registry.npmjs.org`.
- `npm.cmd run test:e2e`: Playwright specs are present, but the command cannot run until `@playwright/test` is installed.
- `npm.cmd audit`: failed with `UNABLE_TO_VERIFY_LEAF_SIGNATURE` against the npm audit endpoint.
- `trivy fs .`: blocked because `trivy` is not installed.
- `trivy config .`: blocked because `trivy` is not installed.
- `docker compose build`: blocked because Docker Desktop/Linux engine is not running.
- `docker compose up`: blocked because Docker Desktop/Linux engine is not running.

## Docker Verification Notes

Docker CLI is installed, but the daemon pipe `dockerDesktopLinuxEngine` is unavailable. Start Docker Desktop, then rerun:

```bash
docker compose build
docker compose up
```

After npm certificate trust is fixed, install Playwright and run:

```bash
npm install
npm run test:e2e
npm audit
```
