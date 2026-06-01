# Production Launch Checklist

## Purpose
Checklist for launching Sejura into the first live owner pilot environment.

## Hard Scope Guard
Do not add or enable:
- Stripe
- payments
- WhatsApp/SMS
- OTA/channel manager sync
- billing
- mobile apps
- auto-confirmed public bookings
- new booking features

## Environment
- `NEXT_PUBLIC_SUPABASE_URL` is set.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` is set.
- `SUPABASE_SERVICE_ROLE_KEY` is set server-side only.
- `OPENAI_API_KEY` is set server-side only.
- `APP_BASE_URL` matches deployed URL.
- Optional email vars are either configured or intentionally left noop-safe.
- Optional Google Calendar vars are configured only if calendar connection is part of the pilot.

## Deployment Gate
- Latest code is deployed to the intended pilot environment.
- Production build completed successfully.
- No validation command failed.
- The deployed app reads the intended env vars.
- The deployed app points to the intended Supabase project.

## Database Gate
Required migrations:
- `0001_sprint1_foundation.sql`
- `0002_booking_core_availability.sql`
- `0003_google_calendar_integration.sql`
- `0004_public_page_ai_receptionist.sql`
- `0005_owner_notifications.sql`
- `0006_public_chat_schema_compatibility.sql`
- `0007_public_chat_booking_draft.sql`

Verification:

```sql
select table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in (
    'owners',
    'properties',
    'property_settings',
    'property_public_pages',
    'rooms',
    'bookings',
    'booking_events',
    'room_blocks',
    'conversations',
    'conversation_messages',
    'ai_tool_calls',
    'google_calendar_connections',
    'owner_notifications',
    'audit_logs'
  )
order by table_name;
```

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

## Owner Account Gate
- Pilot owner can sign in.
- Owner lands in `/app`.
- Owner can open:
  - `/app/property`
  - `/app/rooms`
  - `/app/bookings`
  - `/app/notifications`
- Owner sees only their property data.

## Pilot Property Gate
- Property status is ready for pending mode.
- Public page is enabled.
- Chat is enabled.
- AI booking is enabled.
- Public booking is enabled.
- Auto-confirmation is disabled.
- At least one active room exists.
- Room capacity and pricing are correct.

## Public Flow Gate
- `/p/[propertySlug]` loads signed out.
- Jonny starts conversation.
- Romanian exact-date availability request works.
- Jonny lists available rooms.
- Jonny collects room, name, and phone/email.
- Jonny asks explicit confirmation.
- Confirmation creates pending booking.
- Owner sees pending booking.

## SQL Launch Verification
Tool calls:

```sql
select conversation_id, tool_name, status, error_code, created_at
from public.ai_tool_calls
order by created_at desc
limit 20;
```

Bookings:

```sql
select id, conversation_id, status, source, calendar_sync_status, google_calendar_event_id, created_at
from public.bookings
order by created_at desc
limit 20;
```

Expected:
- `check_availability` success.
- `create_pending_booking` success.
- booking `status = 'pending'`.
- booking `source = 'ai_chat'`.
- `google_calendar_event_id is null` for pending AI-chat booking.

## Go / No-Go
Go if all gates pass and owner understands pending-only operation.

No-go if:
- owner cannot sign in
- public chat cannot start
- pending booking cannot be created
- booking is created as confirmed by Jonny
- cross-owner data appears
- service-role/env vars are missing
- any validation command fails
