# Known Limitations

This project is deployment-prepared, but it is still an academic MVP. Do not claim it has zero bugs.

## Verified Locally

- TypeScript compile
- ESLint
- Prettier
- Unit workflow tests
- Integration workflow tests
- Frontend and backend builds
- Public preview pages and demo fallbacks

## Not Fully Verified Locally

- Real Docker Compose runtime, because Docker Desktop/Linux daemon was not running.
- Trivy local scans, because Trivy is not installed.
- Playwright E2E execution, because `@playwright/test` could not be installed due npm registry certificate verification.
- `pnpm install --frozen-lockfile`, because pnpm is not installed and no `pnpm-lock.yaml` is committed.
- Real Neon/Render/Vercel production networking, which requires deployed service URLs.

## Product Limitations

- Real payment gateways are intentionally not integrated.
- File upload provider integration is prepared through configuration/docs, but provider-specific upload signing still requires final credential verification.
- Email provider fallback exists conceptually, but real delivery requires Resend domain/sender setup.
- Demo-login fallback is for local preview only; real deployment should rely on backend auth and seeded database accounts.
- Token storage should be hardened with secure cookies before a commercial launch.
