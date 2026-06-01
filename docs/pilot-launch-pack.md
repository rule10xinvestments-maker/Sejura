# Pilot Launch Pack

## Goal
Prepare Sejura for the first real pilot owner using the current MVP: owner setup, public page, Jonny public chat, availability checks, pending booking requests, owner dashboard, notifications, and owner follow-up.

This pack is for pilot execution readiness only. It does not add payments, Stripe, new features, OTA, WhatsApp, or mobile apps.

## Launch Scope
- One pilot owner.
- One pilot property.
- Public booking flow in pending-only mode.
- Jonny handles public availability and pending booking requests.
- Owner reviews and acts on pending bookings from the protected app.
- Dashboard notifications are the primary operational signal.
- Email alerts are optional and may remain noop-safe if no provider is configured.

## Launch Documents
- `docs/deployment-checklist.md`
- `docs/env-matrix.md`
- `docs/owner-onboarding-script.md`
- `docs/manual-smoke-test.md`
- `docs/pilot-readiness-checklist.md`
- `docs/security-checklist.md`
- `docs/public-booking-flow-closeout.md`

## Pre-Launch Sequence
1. Confirm the target environment and URL.
2. Confirm all required environment variables are present.
3. Apply migrations `0001` through `0007`.
4. Confirm the owner account can sign in.
5. Create or verify pilot property data.
6. Create or verify at least one active room.
7. Enable public page, chat, AI booking, and public booking.
8. Confirm auto-confirmation is disabled.
9. Run the manual smoke test.
10. Share the public property URL with the pilot owner only after smoke passes.

## Migration Checklist
Apply in order:
- `0001_sprint1_foundation.sql`
- `0002_booking_core_availability.sql`
- `0003_google_calendar_integration.sql`
- `0004_public_page_ai_receptionist.sql`
- `0005_owner_notifications.sql`
- `0006_public_chat_schema_compatibility.sql`
- `0007_public_chat_booking_draft.sql`

Verify after migration:

```sql
select table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in (
    'owners',
    'properties',
    'rooms',
    'bookings',
    'conversations',
    'conversation_messages',
    'ai_tool_calls',
    'owner_notifications'
  )
order by table_name;
```

```sql
select column_name
from information_schema.columns
where table_schema = 'public'
  and table_name = 'conversations'
  and column_name in ('metadata', 'related_booking_id');
```

```sql
select column_name
from information_schema.columns
where table_schema = 'public'
  and table_name = 'bookings'
  and column_name in ('conversation_id', 'source', 'status');
```

## Rollback Checklist
Use rollback only if pilot-blocking behavior is found after deployment.

Operational rollback:
- Disable the pilot public page or chat in `property_public_pages`.
- Disable AI booking or public booking in `property_settings`.
- Keep owner app access available so pending requests can still be reviewed.
- Preserve `conversations`, `conversation_messages`, `ai_tool_calls`, and `bookings` for diagnosis.

Deployment rollback:
- Revert to the last known good app build.
- Keep database migrations applied unless data integrity is at risk.
- If a database rollback is required, first export affected tables:
  - `properties`
  - `property_public_pages`
  - `property_settings`
  - `rooms`
  - `bookings`
  - `conversations`
  - `conversation_messages`
  - `ai_tool_calls`
  - `owner_notifications`

No destructive database rollback should be done during pilot hours without an export and an explicit owner-impact note.

## Demo / Seed Data Strategy
Use realistic but clearly pilot-safe data:
- One owner account using the pilot owner email.
- One property with real name, city, check-in/check-out times, and public description.
- Two or three representative active rooms if available.
- Room prices in RON.
- No fake confirmed bookings unless needed to demonstrate availability blocking.
- A small number of room blocks or confirmed bookings can be added only to test unavailable dates.

Seed data should support these demo paths:
- A date range with at least one available room.
- A date range with no availability or limited availability.
- A pending booking created by Jonny.
- Owner confirms/rejects/cancels from the protected app.

## Owner Onboarding Flow
1. Explain that Sejura is in pilot mode and all public bookings are pending.
2. Sign the owner in.
3. Review property details and public URL.
4. Review rooms, prices, and capacity.
5. Explain the public guest flow with Jonny.
6. Run one guest smoke together.
7. Show where pending bookings appear.
8. Show where notifications appear.
9. Confirm owner knows how to confirm, reject, or cancel.
10. Agree on support channel and pilot feedback rhythm.

## Manual Pilot Smoke
Required before sharing the public URL:
- Owner sign-in works.
- `/app` dashboard loads.
- `/app/property` shows correct pilot property.
- `/app/rooms` shows active rooms.
- Public page `/p/[propertySlug]` loads signed out.
- Jonny starts conversation.
- Romanian availability request returns rooms.
- Room/name/phone flow asks explicit confirmation.
- Explicit confirmation creates a pending booking.
- Booking appears in `/app/bookings`.
- `ai_tool_calls` shows `check_availability` and `create_pending_booking` success.
- Booking has `source = 'ai_chat'`.
- Booking has `status = 'pending'`.
- Pending booking has no Google Calendar event.

## Known Limitations
- Public rate limiting is in-memory.
- Public chat sessions are cookie-bound and do not follow a guest across browsers/devices.
- Jonny asks for clarification on ambiguous dates.
- Pending booking owner follow-up is required.
- Email may be noop-safe until a provider is configured.
- No payments, OTA sync, WhatsApp/SMS, phone AI, billing, admin platform, or mobile apps.
- Supabase integration/RLS tests are not yet fully automated against a disposable database.

## Support Notes
- Keep the first pilot to one owner/property.
- Monitor `ai_tool_calls` during the first live conversations.
- Treat dashboard bookings/notifications as the source of truth.
- Capture exact guest message text when reporting Jonny issues.
- Preserve failed conversations and tool-call rows for debugging.
- Prefer disabling public chat over deleting data if anything goes wrong.

## Validation Results
- `pnpm.cmd lint`: passed.
- `pnpm.cmd typecheck`: passed.
- `pnpm.cmd test`: passed, 16 files / 78 tests.
- `pnpm.cmd build`: passed.
