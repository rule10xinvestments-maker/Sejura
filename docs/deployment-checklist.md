# Deployment Checklist

## Purpose
Deploy the current Sejura MVP safely for the first pilot owner.

## Pre-Deploy
- Confirm the deploy target is the pilot environment.
- Confirm the branch/build contains Sprints 1 through 7 documentation and Sprint 6 hardening.
- Confirm no payments, Stripe, OTA, WhatsApp, mobile, billing, or new booking features are included.
- Confirm `.env.local` or hosting secrets match `docs/env-matrix.md`.
- Confirm the Supabase project is the intended pilot project.
- Confirm the pilot owner knows the launch window and support contact.

## Required Environment
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`
- `APP_BASE_URL`

Optional for pilot:
- `EMAIL_PROVIDER`
- `EMAIL_PROVIDER_API_KEY`
- `EMAIL_FROM_ADDRESS`
- `EMAIL_FROM_NAME`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_CALENDAR_REDIRECT_URI`
- `GOOGLE_TOKEN_ENCRYPTION_KEY`

## Build Gate
Run before deploy:
- `pnpm.cmd lint`
- `pnpm.cmd typecheck`
- `pnpm.cmd test`
- `pnpm.cmd build`

Do not deploy if lint, typecheck, or build fails.

## Migration Gate
Apply migrations in order:
- `0001_sprint1_foundation.sql`
- `0002_booking_core_availability.sql`
- `0003_google_calendar_integration.sql`
- `0004_public_page_ai_receptionist.sql`
- `0005_owner_notifications.sql`
- `0006_public_chat_schema_compatibility.sql`
- `0007_public_chat_booking_draft.sql`

Verify required pilot tables:

```sql
select table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in (
    'properties',
    'property_public_pages',
    'property_settings',
    'rooms',
    'bookings',
    'conversations',
    'conversation_messages',
    'ai_tool_calls',
    'owner_notifications'
  )
order by table_name;
```

Verify public booking columns:

```sql
select table_name, column_name
from information_schema.columns
where table_schema = 'public'
  and (
    (table_name = 'conversations' and column_name in ('metadata', 'related_booking_id')) or
    (table_name = 'bookings' and column_name in ('conversation_id', 'source', 'status'))
  )
order by table_name, column_name;
```

## Post-Deploy Smoke
- Visit `APP_BASE_URL`.
- Sign in as pilot owner.
- Open `/app`.
- Open `/app/property`.
- Open `/app/rooms`.
- Open `/app/bookings`.
- Open `/app/notifications`.
- Visit `/p/[propertySlug]` signed out.
- Complete the manual smoke test in `docs/manual-smoke-test.md`.

## Rollback
Fast operational rollback:
- Disable public page/chat or AI/public booking settings for the pilot property.
- Keep the owner app available.
- Do not delete pilot conversations or bookings.

Build rollback:
- Redeploy the previous known good build.
- Keep database migrations unless a migration is proven to be the blocker.

Database rollback:
- Export affected tables first.
- Document affected owner/property IDs.
- Prefer forward fixes or feature disablement over destructive rollback during active pilot use.

## Go / No-Go
Go if:
- Build gate passes.
- Required env vars are present.
- Migrations are applied.
- Owner app smoke passes.
- Public chat smoke creates a pending booking.
- Owner can see the pending booking.

No-go if:
- Service-role key is missing.
- Public chat cannot start.
- Pending booking creation fails.
- Owner cannot sign in.
- Owner cannot see bookings.
- Any validation command fails.
