# Environment And Deployment

## Required Environment Variables
Minimum pilot requirements:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`
- `APP_BASE_URL`

## Google Calendar Environment Variables
Required when Google Calendar OAuth/sync is enabled:
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_CALENDAR_REDIRECT_URI`
- `GOOGLE_TOKEN_ENCRYPTION_KEY`

`GOOGLE_TOKEN_ENCRYPTION_KEY` must be a 32+ character server-only secret used for AES-256-GCM token encryption.

## Optional Email Provider Variables
Owner email alerts are optional/noop-safe until configured:
- `EMAIL_PROVIDER`
- `EMAIL_PROVIDER_API_KEY`
- `EMAIL_FROM_ADDRESS`
- `EMAIL_FROM_NAME`

Dashboard notifications remain the reliable pilot signal even when email is not configured.

## Public Vs Server-Only
Allowed public variables:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Must never be `NEXT_PUBLIC`:
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_TOKEN_ENCRYPTION_KEY`
- `EMAIL_PROVIDER_API_KEY`

## Migrations
Apply in order:
- `0001_sprint1_foundation.sql`
- `0002_booking_core_availability.sql`
- `0003_google_calendar_integration.sql`
- `0004_public_page_ai_receptionist.sql`
- `0005_owner_notifications.sql`
- `0006_public_chat_schema_compatibility.sql`
- `0007_public_chat_booking_draft.sql`

## Restart Commands
Local development server:

```powershell
pnpm.cmd dev
```

Production-style build:

```powershell
pnpm.cmd build
```

Production start depends on hosting platform. For a local Next production start after building:

```powershell
pnpm.cmd start
```

If environment variables change, restart the app process so server-side config is reloaded.

## Validation Commands
Run before pilot/deploy:

```powershell
pnpm.cmd lint
pnpm.cmd typecheck
pnpm.cmd test
pnpm.cmd build
```

Latest accepted validation:
- lint passed
- typecheck passed
- tests passed, 16 files / 78 tests
- build passed

## Deployment Checklist Summary
- Confirm target URL and `APP_BASE_URL`.
- Confirm required env vars.
- Confirm migrations `0001` through `0007`.
- Confirm owner account can sign in.
- Confirm property, public page, settings, and rooms.
- Confirm public smoke creates pending AI-chat booking.
- Confirm owner can see and act on booking.
- Prefer disabling public page/chat over deleting data if rollback is needed.
