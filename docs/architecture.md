# RasmBazaar Architecture

RasmBazaar is a modular monolith academic prototype with a Next.js frontend, NestJS REST API, PostgreSQL database, and Prisma ORM.

## Runtime Components

- `apps/web`: Next.js app router frontend for public marketplace, customer planner, vendor workspace, and admin console.
- `apps/api`: NestJS API with modules for auth, weddings, tasks, vendors, service requests, proposals, bookings, reviews, notifications, and admin.
- `prisma`: Prisma schema and migrations.
- `scripts/seed.cjs`: deterministic fictional demo-data generator.
- `docker-compose.yml`: local PostgreSQL, API, and frontend stack.

## Data Flow

1. Browser calls `NEXT_PUBLIC_API_URL`.
2. API validates JWT access token through global guards.
3. Role guards protect admin/vendor/customer routes.
4. Services enforce ownership checks for weddings, vendors, proposals, bookings, messages, and reviews.
5. Prisma persists data to PostgreSQL.

## Major Domains

- Customer planning: weddings, events, members, guests, budgets, tasks, evidence, approvals, blockers.
- Marketplace: categories, vendors, services, packages, availability, public profiles.
- Requests and proposals: service requests, matches, invitations, immutable proposal versions, comments, acceptance.
- Bookings: agreement state, milestones, payments, budget sync, messages, activity.
- Trust: verified reviews, disputes, vendor responses, trust signals.
- Admin: users, verification review, disputes, review moderation, audit logs, dashboard.

## Deployment Shape

- Frontend: Vercel.
- Backend: Render.
- Database: Neon PostgreSQL.
- Images: Cloudinary public assets for vendor imagery.
- Private files: Supabase private storage or authenticated Cloudinary assets for receipts, evidence, agreements, and verification documents.
- Email: Resend.
- Monitoring: Sentry.

## Production Boundaries

- The frontend must call the Render API through `NEXT_PUBLIC_API_URL`.
- The backend only allows production CORS origins listed in `FRONTEND_URL`.
- Neon connections should include `sslmode=require`.
- Swagger is controlled by `ENABLE_SWAGGER` and should be disabled for public production.
- Provider credentials are injected through hosting environment variables, not copied into Docker images.
