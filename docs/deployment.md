# Deployment Guide

RasmBazaar is prepared for free-tier deployment with the frontend and backend split across managed services.

## Target Free-Tier Architecture

- Frontend: Vercel, serving `apps/web`
- Backend: Render Web Service, serving `apps/api`
- Database: Neon PostgreSQL
- Public images: Cloudinary
- Private files: Supabase Storage private bucket or private Cloudinary assets
- Email: Resend
- Monitoring: Sentry
- CI/security: GitHub Actions plus Trivy

## Vercel Frontend

Recommended root: repository root.

Build command:

```bash
npm ci
npm run build:web
```

Output is handled by Vercel's Next.js runtime.

Environment variables:

```text
NEXT_PUBLIC_API_URL=https://<your-render-service>.onrender.com
NEXT_PUBLIC_SENTRY_DSN=<optional public Sentry DSN>
```

Image hosts are configured in `apps/web/next.config.mjs` for Unsplash, UI Avatars, Cloudinary, and Supabase-hosted assets.

## Render Backend

Create a Render Web Service from the repo.

Build command:

```bash
npm ci
npm run prisma:generate
npm run build:api
```

Start command:

```bash
npm run start:api:prod
```

`start:api:prod` runs Prisma migrations and then starts NestJS. Render injects `PORT`; the API binds to `0.0.0.0`.

Environment variables:

```text
NODE_ENV=production
PORT=10000
DATABASE_URL=<Neon pooled URL with sslmode=require>
JWT_ACCESS_SECRET=<long random value>
JWT_REFRESH_SECRET=<long random value>
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
FRONTEND_URL=https://<your-vercel-app>.vercel.app
ENABLE_SWAGGER=false
CLOUDINARY_CLOUD_NAME=<cloud name>
CLOUDINARY_API_KEY=<api key>
CLOUDINARY_API_SECRET=<api secret>
CLOUDINARY_PRIVATE_FOLDER=private
SUPABASE_URL=<optional>
SUPABASE_SERVICE_ROLE_KEY=<optional>
SUPABASE_PRIVATE_BUCKET=<optional>
RESEND_API_KEY=<api key>
EMAIL_FROM=RasmBazaar <no-reply@your-domain.example>
SENTRY_DSN=<optional backend DSN>
```

## Neon PostgreSQL

Use a pooled Neon connection string for Render. Include SSL:

```text
?sslmode=require
```

Production migrations:

```bash
npm run prisma:deploy
```

Seed demo data only for demos/review environments:

```bash
npm run seed
```

## Cloudinary and Private Files

Use Cloudinary for public marketplace images and portfolio images. For private receipts, evidence, agreements, and verification documents, use one of:

- Supabase Storage private bucket with signed URLs.
- Cloudinary authenticated/private delivery with strict folder controls.

The current MVP stores file metadata/URLs and is ready for either storage provider; production upload signing should be verified after provider credentials are connected.

## Resend Email

Set `RESEND_API_KEY` and `EMAIL_FROM`. Until verified domain setup is complete, use Resend's permitted development sender.

## Sentry Monitoring

Set `SENTRY_DSN` for the backend and `NEXT_PUBLIC_SENTRY_DSN` for the frontend. Source-map upload is not automated in this MVP and should be configured after deployment.

## Docker

Local production-like run:

```bash
docker compose build
docker compose up
```

The Docker setup uses multi-stage images, non-root users, health checks, PostgreSQL volume persistence, and `.dockerignore` to avoid copying local secrets.

## Health Checks

API:

```text
GET /api/health
```

The endpoint checks database connectivity and returns unhealthy when PostgreSQL is unavailable.

## Troubleshooting

- `Failed to fetch`: frontend cannot reach the API URL or the API cannot reach PostgreSQL.
- Render health check fails: confirm `DATABASE_URL`, Neon SSL, migrations, and `PORT`.
- Vercel calls localhost: set `NEXT_PUBLIC_API_URL` to the Render URL and redeploy.
- Prisma P1001: database is down, connection string is wrong, or SSL mode is missing.
- Swagger visible in production: set `ENABLE_SWAGGER=false`.
