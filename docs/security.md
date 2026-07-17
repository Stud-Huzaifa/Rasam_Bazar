# Security Notes

## Implemented

- JWT access tokens and refresh-token rotation
- bcrypt password hashing
- Global auth guard with public-route decorator
- Role-based guard for protected workflows
- Helmet security headers
- Production CORS restricted by `FRONTEND_URL`
- ValidationPipe with whitelist and transform enabled
- Auth endpoint rate limiting
- Production environment validation for critical secrets
- Health endpoint for database connectivity
- Swagger disabled by default in production unless explicitly enabled
- Docker images use non-root users
- `.dockerignore` excludes `.env`, local caches, build output, and logs

## Secrets

Never commit real values for:

- `DATABASE_URL`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `CLOUDINARY_API_SECRET`
- `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY`
- `SENTRY_DSN`

Use Render, Vercel, Neon, Cloudinary, Supabase, Resend, and Sentry environment-variable managers.

## Cookies and Tokens

The current frontend stores demo/API tokens in `localStorage`. For a production commercial launch, migrate refresh-token handling to `HttpOnly`, `Secure`, `SameSite=Lax/Strict` cookies and keep access tokens short-lived.

## File Uploads

Public images can use Cloudinary. Private evidence, receipts, agreements, and verification documents should use signed URLs from Supabase private storage or authenticated/private Cloudinary delivery.

## Security Scans

CI includes Trivy filesystem, config, and Docker image scans. Local Trivy execution was not possible because Trivy is not installed in this environment.

## Post-Deployment Verification

- Confirm CORS only allows the production Vercel URL.
- Confirm Swagger is not exposed in production.
- Confirm Neon uses SSL.
- Confirm private file URLs expire and cannot be browsed anonymously.
- Confirm Resend sender/domain is verified.
- Confirm Sentry receives frontend and backend errors.
