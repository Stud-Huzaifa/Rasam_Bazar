# Testing Guide

## Local Commands

This repository currently uses `package-lock.json` and npm workspaces.

```bash
npm ci
npm run prisma:format
npm run prisma:validate
npm run typecheck
npm run lint
npm run format:check
npm run test
npm run test:integration
npm run build
```

On Windows PowerShell, use `npm.cmd`.

## Requested pnpm Commands

`pnpm-workspace.yaml` has been added so the project is pnpm-workspace ready. A `pnpm-lock.yaml` has not been generated in this environment because `pnpm` is not installed locally and registry access previously failed with certificate verification errors.

Once pnpm is available:

```bash
pnpm install
pnpm prisma format
pnpm prisma validate
pnpm typecheck
pnpm lint
pnpm format:check
pnpm test
pnpm test:integration
pnpm test:e2e
pnpm build
```

Use `pnpm install --frozen-lockfile` only after committing a generated `pnpm-lock.yaml`.

## Unit and Integration Coverage

The dependency-free test suite covers:

- Authentication and authorization
- Vendor marketplace workflows
- Service requests and proposal revisions
- Booking, agreement, payment, and budget workflows
- Guests, catering, messaging, notifications, and wedding-day operations
- Reviews, incidents, disputes, and admin permissions
- Planner workflow generation

## Playwright E2E

Playwright journey specs are present in `tests/e2e`:

- Customer journey
- Vendor journey
- Admin journey

Run after installing Playwright:

```bash
npm install --save-dev @playwright/test
npx playwright install chromium
npm run test:e2e
```

Local execution was blocked because `@playwright/test` could not be installed due npm registry certificate verification failure.

## CI

GitHub Actions runs on pull requests and pushes to `develop` and `main`. CI covers dependency installation, Prisma format/validation, typecheck, lint, Prettier, unit tests, integration tests, frontend build, backend build, Docker image builds, and Trivy scans.
