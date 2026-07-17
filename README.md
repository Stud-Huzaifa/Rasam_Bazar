# RasmBazaar

RasmBazaar is a modular monolith for a desi wedding-services marketplace, smart wedding planner, and family coordination platform.

This repository contains a deployment-prepared academic MVP with rich fictional demo data and final-prep documentation.

See also:

- `docs/audit-report.md`
- `docs/architecture.md`
- `docs/deployment.md`
- `docs/testing.md`
- `docs/security.md`
- `docs/role-permission-matrix.md`
- `docs/manual-qa-checklist.md`
- `docs/known-limitations.md`
- `docs/final-submission-report.md`

Completed phases:

- Phase 1: foundation, Docker, Prisma, Swagger, health, CI, seed data
- Phase 2: customer/vendor registration, login, refresh tokens, logout, email verification token flow, password reset token flow, roles and guards
- Phase 3: wedding setup, dashboard summary, events, family members, guests, budget, tasks
- Phase 4: rule-based smart planner, generated tasks, dependencies, evidence, approvals, blockers, reminders, progress tracking
- Phase 5: vendor profile management, verification submissions, portfolio, services, packages, teams, and availability
- Phase 6: marketplace discovery, backend search/filter/sort, categories, availability-aware browsing, public vendor profiles, and inquiry entry points
- Phase 7: customer service requests, request publishing, vendor invitations, rule-based vendor matching, and vendor-side matching request discovery
- Phase 8: vendor proposals, immutable proposal versions, revisions, comments, customer comparison, shortlist, accept/reject, and withdrawal workflows
- Phase 9: accepted proposal bookings, agreement confirmation, payment milestones, manual payment tracking, booking status changes, and budget synchronization
- Phase 10: booking-backed reviews, vendor responses, dispute notes, public trust signals, marketplace trust scoring, and customer/vendor feedback history
- Phase 11: in-app notifications, unread counts, booking message threads, customer/vendor inboxes, and wedding/booking activity history
- Phase 12: admin dashboard, platform metrics, vendor verification review, review/dispute moderation, user suspension controls, and audit-log visibility

## Tech Stack

- Frontend: Next.js, TypeScript, Tailwind CSS
- Backend: NestJS, TypeScript, REST API, Swagger, class-validator
- Database: PostgreSQL and Prisma
- Auth: JWT access tokens, refresh-token rotation, bcrypt password hashing
- DevOps: Docker Compose, GitHub Actions, ESLint, Prettier

## Project Structure

- `apps/web`: Next.js frontend
- `apps/api`: NestJS backend
- `prisma`: Prisma schema and migrations
- `scripts`: seed scripts
- `.github/workflows`: CI workflow

## Environment

Copy `.env.example` to `.env` and fill in values.

Important variables:

- `DATABASE_URL`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `JWT_ACCESS_EXPIRY`
- `JWT_REFRESH_EXPIRY`
- `NEXT_PUBLIC_API_URL`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `RESEND_API_KEY`
- `SENTRY_DSN`

## Setup

```bash
npm install
docker compose up -d postgres
npm run prisma:migrate
npm run prisma:generate
npm run seed
```

## Run Locally

Backend:

```bash
npm run dev:api
```

Frontend:

```bash
npm run dev
```

Frontend runs on `http://localhost:3000`.
API runs on `http://localhost:3001/api`.
Swagger docs are available at `http://localhost:3001/api/docs`.

## Docker

```bash
docker compose up --build
```

## Verification

```bash
npm run prisma:validate
npm run prisma:format
npm run typecheck
npm run lint
npm run format:check
npm run test:integration
npm run build
npm run test
```

On Windows PowerShell, use `npm.cmd` if script execution policy blocks `npm.ps1`.

The repository is npm-lock based today. `pnpm-workspace.yaml` is included for pnpm readiness, but `pnpm install --frozen-lockfile` requires generating and committing `pnpm-lock.yaml` in an environment where pnpm can access the registry.

## Free-Tier Deployment Targets

- Frontend: Vercel (`apps/web`)
- Backend: Render (`apps/api`)
- Database: Neon PostgreSQL with `sslmode=require`
- Public images: Cloudinary
- Private files: Supabase private bucket or private Cloudinary assets
- Email: Resend
- Monitoring: Sentry

See `docs/deployment.md` for commands, environment variables, and post-deployment checks.

## Seed Users

All seeded users use this password:

```text
Password123!
```

Seeded accounts:

- `admin@rasmbazaar.test`
- `customer@rasmbazaar.test`
- `vendor@rasmbazaar.test`

The seed script generates a large fictional dataset:

- 12 weddings
- 108 vendors
- 216 service requests
- 648 proposals
- 216 bookings
- 207 reviews
- Hundreds of tasks, guests, notifications, messages, and budget records

## Current API Highlights

- `POST /api/auth/register/customer`
- `POST /api/auth/register/vendor`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `POST /api/auth/refresh`
- `POST /api/auth/verify-email`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`
- `GET /api/health`
- `POST /api/weddings`
- `GET /api/weddings`
- `GET /api/weddings/:weddingId`
- `PATCH /api/weddings/:weddingId`
- `DELETE /api/weddings/:weddingId`
- `GET /api/weddings/:weddingId/dashboard`
- `POST /api/weddings/:weddingId/events`
- `GET /api/weddings/:weddingId/events`
- `GET /api/events/:eventId`
- `PATCH /api/events/:eventId`
- `DELETE /api/events/:eventId`
- `POST /api/weddings/:weddingId/members`
- `GET /api/weddings/:weddingId/members`
- `PATCH /api/weddings/:weddingId/members/:memberId`
- `DELETE /api/weddings/:weddingId/members/:memberId`
- `POST /api/weddings/:weddingId/generate-plan`
- `GET /api/weddings/:weddingId/plan`
- `GET /api/weddings/:weddingId/progress`
- `POST /api/weddings/:weddingId/tasks`
- `GET /api/weddings/:weddingId/tasks`
- `GET /api/tasks/:taskId`
- `PATCH /api/tasks/:taskId`
- `POST /api/tasks/:taskId/assign`
- `POST /api/tasks/:taskId/start`
- `POST /api/tasks/:taskId/complete`
- `POST /api/tasks/:taskId/evidence`
- `POST /api/tasks/:taskId/comments`
- `POST /api/tasks/:taskId/blockers`
- `POST /api/tasks/:taskId/approve`
- `POST /api/tasks/:taskId/reject`
- `GET /api/users/me/tasks`
- `GET /api/users/me/approvals`
- `GET /api/vendors`
- `GET /api/vendors/:vendorId`
- `GET /api/categories`
- `GET /api/categories/:slug`
- `GET /api/vendors/me`
- `GET /api/vendors/me/dashboard`
- `GET /api/vendors/me/inquiries`
- `PATCH /api/vendor-inquiries/:inquiryId`
- `POST /api/vendors`
- `PATCH /api/vendors/:vendorId`
- `POST /api/vendors/:vendorId/inquiries`
- `POST /api/vendors/:vendorId/verification`
- `POST /api/vendors/:vendorId/portfolio`
- `DELETE /api/portfolio/:portfolioId`
- `POST /api/vendors/:vendorId/teams`
- `PATCH /api/teams/:teamId`
- `POST /api/vendors/:vendorId/services`
- `GET /api/vendors/:vendorId/services`
- `PATCH /api/services/:serviceId`
- `DELETE /api/services/:serviceId`
- `POST /api/services/:serviceId/packages`
- `PATCH /api/packages/:packageId`
- `POST /api/vendors/:vendorId/availability`
- `GET /api/vendors/:vendorId/availability`
- `PATCH /api/availability/:availabilityId`
- `DELETE /api/availability/:availabilityId`
- `POST /api/service-requests`
- `GET /api/service-requests`
- `GET /api/service-requests/:requestId`
- `PATCH /api/service-requests/:requestId`
- `POST /api/service-requests/:requestId/publish`
- `POST /api/service-requests/:requestId/invite-vendor`
- `POST /api/service-requests/:requestId/close`
- `GET /api/service-requests/:requestId/matching-vendors`
- `GET /api/vendors/me/matching-requests`
- `POST /api/service-requests/:requestId/proposals`
- `GET /api/service-requests/:requestId/proposals`
- `GET /api/service-requests/:requestId/proposals/compare`
- `GET /api/vendors/me/proposals`
- `GET /api/customer/proposals`
- `GET /api/proposals/:proposalId`
- `POST /api/proposals/:proposalId/revisions`
- `POST /api/proposals/:proposalId/comments`
- `POST /api/proposals/:proposalId/shortlist`
- `POST /api/proposals/:proposalId/request-revision`
- `POST /api/proposals/:proposalId/accept`
- `POST /api/proposals/:proposalId/reject`
- `POST /api/proposals/:proposalId/withdraw`
- `POST /api/proposals/:proposalId/booking`
- `GET /api/customer/bookings`
- `GET /api/vendor/bookings`
- `GET /api/weddings/:weddingId/bookings`
- `GET /api/bookings/:bookingId`
- `POST /api/bookings/:bookingId/customer-confirm`
- `POST /api/bookings/:bookingId/vendor-confirm`
- `POST /api/bookings/:bookingId/start`
- `POST /api/bookings/:bookingId/complete`
- `POST /api/bookings/:bookingId/cancel`
- `POST /api/bookings/:bookingId/payments`
- `PATCH /api/bookings/:bookingId/payments/:paymentId`
- `POST /api/bookings/:bookingId/payments/:paymentId/mark-paid`
- `POST /api/bookings/:bookingId/sync-budget`
- `POST /api/bookings/:bookingId/review`
- `PATCH /api/reviews/:reviewId`
- `POST /api/reviews/:reviewId/vendor-response`
- `GET /api/customer/reviews`
- `GET /api/vendor/reviews`
- `GET /api/vendors/:vendorId/reviews`
- `GET /api/vendors/:vendorId/trust`
- `GET /api/vendor/trust`
- `POST /api/bookings/:bookingId/disputes`
- `PATCH /api/disputes/:disputeId`
- `GET /api/notifications`
- `GET /api/notifications/unread-count`
- `PATCH /api/notifications/:notificationId/read`
- `POST /api/notifications/mark-all-read`
- `GET /api/message-threads`
- `POST /api/bookings/:bookingId/message-thread`
- `GET /api/message-threads/:threadId/messages`
- `POST /api/message-threads/:threadId/messages`
- `POST /api/message-threads/:threadId/read`
- `GET /api/weddings/:weddingId/activity`
- `GET /api/bookings/:bookingId/activity`
- `GET /api/admin/dashboard`
- `GET /api/admin/users`
- `PATCH /api/admin/users/:userId/status`
- `GET /api/admin/vendor-verifications`
- `PATCH /api/admin/vendor-verifications/:verificationId`
- `GET /api/admin/reviews`
- `PATCH /api/admin/reviews/:reviewId`
- `GET /api/admin/disputes`
- `PATCH /api/admin/disputes/:disputeId`
- `GET /api/admin/audit-logs`

## Deployment

Recommended free-tier deployment:

- Frontend: Vercel
- Backend: Render
- Database: Neon PostgreSQL
- Images: Cloudinary
- Email: Resend
- Monitoring: Sentry

Detailed instructions are in `docs/deployment.md`.

## Known Limitations

This is an academic prototype. Payments are manual/simulated, verification documents are fictional URLs, and private file storage should be hardened before real use. See `docs/known-limitations.md`.
