# Manual QA Checklist

## Authentication

- Customer can log in and lands on customer weddings.
- Vendor can log in and lands on vendor dashboard.
- Admin can log in and lands on admin console.
- Suspended users cannot access protected routes.

## Customer

- Create wedding.
- Add/edit events.
- Add guests and RSVP states.
- Add budget items and paid states.
- Generate planner.
- Start, complete, comment on, block, evidence-upload, approve, and reject tasks.
- Browse marketplace and vendor profile.
- Create service request.
- Compare proposals.
- Accept proposal and view booking.
- Add payment milestone and mark paid.
- Send/receive booking messages.
- Submit review after completed booking.
- Open dispute.
- View notifications and activity.
- Check wedding-day ops on mobile width.

## Vendor

- Update profile.
- Submit verification.
- Add portfolio.
- Add service and package.
- Add team and availability.
- View matching requests.
- Submit proposal and revision.
- View booking.
- Confirm agreement.
- Respond to review.
- Respond to dispute.

## Admin

- View dashboard KPIs and charts.
- Search users/vendors/cases.
- Approve, reject, or request info on verification.
- Suspend/reactivate user.
- Moderate reviews.
- Open dispute case drawer and record resolution.
- Export CSV.
- View audit logs.

## Responsive Widths

Test:

- 320px
- 375px
- 430px
- 768px
- 1024px
- 1280px
- 1440px

Check navigation, forms, tables, drawers, marketplace cards, proposal comparison, messages, and admin console.

## Browsers

- Chrome
- Edge
- Firefox
- Mobile Chrome

## Post-Deployment Smoke Tests

- Vercel frontend loads and points to the Render API URL, not localhost.
- Render `/api/health` returns healthy after migrations.
- Seeded demo accounts can log in after seed data is run.
- CORS blocks unexpected origins and allows the Vercel domain.
- Swagger is unavailable when `ENABLE_SWAGGER=false`.
- Cloudinary public images render.
- Private file URLs are not publicly browsable.
- Resend sends at least one development email.
- Sentry receives a test frontend and backend error.
