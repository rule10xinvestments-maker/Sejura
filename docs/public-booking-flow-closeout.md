# Public Booking Flow Closeout

## Status
Public Jonny booking flow is real-smoke green as of 2026-06-01.

Verified live:
- Public property page loads.
- Jonny starts a public conversation.
- Romanian date and person extraction works.
- `check_availability` logs `success` in `ai_tool_calls`.
- Room selection, guest name, and phone extraction work.
- Explicit guest confirmation creates a pending booking.
- `create_pending_booking` logs `success` in `ai_tool_calls`.
- Booking appears in `bookings`.
- Booking uses `source = 'ai_chat'`.
- Stale draft reuse is fixed.
- Post-booking stale confirmation is fixed.

## Bugs Found
- Fresh availability requests could reuse stale selected room/contact details from an older `booking_draft`.
- A completed draft could remain available after a successful pending booking, allowing a later confirmation-style message to reopen or reuse old booking details.
- Missing or older database shape could block the public booking flow because conversation metadata and booking-to-conversation linkage were not guaranteed in all environments.

## Root Causes
- `booking_draft` lives in conversation metadata and can persist across multiple guest turns in the same public session.
- The deterministic Romanian booking path needed to distinguish a fresh availability request from continuing an existing draft.
- Successful booking creation did not always clear the draft state after `create_pending_booking`.
- The live database needed the Sprint 4 compatibility migration plus the booking draft migration, not only the original public chat schema.

## Fixes Made
- Fresh date/person availability messages now create a new draft with room/contact fields cleared and `awaiting = 'room_selection'`.
- Room selection is constrained to the latest availability result stored in the active draft.
- Guest name and phone/email are extracted into the active draft before asking for explicit final confirmation.
- Explicit confirmation rechecks availability for the selected room before creating the pending booking.
- Successful `create_pending_booking` clears `booking_draft` from conversation metadata.
- Pending bookings created by Jonny pass `source = 'ai_chat'` and `conversationId`.
- Unit coverage was added for Romanian availability extraction, room/contact continuation, explicit confirmation booking creation, stale draft clearing, post-booking stale confirmation prevention, and invalid room choices.

## Required Environment Variables
Required for the public booking smoke:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`
- `APP_BASE_URL`

Related but not required for pending AI-chat booking creation:
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_CALENDAR_REDIRECT_URI`
- `GOOGLE_TOKEN_ENCRYPTION_KEY`
- `EMAIL_PROVIDER`
- `EMAIL_PROVIDER_API_KEY`
- `EMAIL_FROM_ADDRESS`
- `EMAIL_FROM_NAME`

Notes:
- Without `OPENAI_API_KEY`, Jonny should fail safely with an unavailable message instead of creating bookings.
- Pending AI-chat bookings do not create Google Calendar events; calendar sync remains for confirmed bookings.
- Missing email provider settings should not break booking creation.

## Required Migrations Applied
- `src/supabase/migrations/0001_sprint1_foundation.sql`
- `src/supabase/migrations/0002_booking_core_availability.sql`
- `src/supabase/migrations/0003_google_calendar_integration.sql`
- `src/supabase/migrations/0004_public_page_ai_receptionist.sql`
- `src/supabase/migrations/0005_owner_notifications.sql`
- `src/supabase/migrations/0006_public_chat_schema_compatibility.sql`
- `src/supabase/migrations/0007_public_chat_booking_draft.sql`

The public booking closeout specifically depends on:
- `conversations.metadata` from `0007_public_chat_booking_draft.sql`.
- `bookings.conversation_id` from `0007_public_chat_booking_draft.sql`.
- Public chat tables and tool-call logging from `0004_public_page_ai_receptionist.sql` / `0006_public_chat_schema_compatibility.sql`.

## Smoke Test Steps
1. Start the app with Supabase and `OPENAI_API_KEY` configured.
2. Visit `/p/[propertySlug]` while signed out.
3. Confirm the public page renders with the property and room context.
4. Start Jonny chat.
5. Send a Romanian request with dates and guest count, for example: `Vreau o camera pentru 4 persoane intre 12 si 16 iunie`.
6. Confirm Jonny lists available rooms and says the reservation is not automatically confirmed.
7. Verify `ai_tool_calls` contains a successful `check_availability` call for the conversation.
8. Choose one of the offered rooms and provide guest name plus phone, for example: `Aleg B parter, Mihai Evreu, 0745855634`.
9. Confirm Jonny summarizes the pending request and asks for explicit confirmation.
10. Send explicit confirmation, for example: `Da, confirm, trimite cererea`.
11. Confirm Jonny reports that the request was sent to the owner.
12. Verify `ai_tool_calls` contains successful `check_availability` and `create_pending_booking` calls after confirmation.
13. Verify `bookings` contains a pending row with `source = 'ai_chat'` and the expected `conversation_id`.
14. Open `/app/bookings` as the owner and confirm the booking is visible as pending.
15. Start a new availability request in the same conversation and verify old room/contact details are not reused.
16. After a successful booking, send another confirmation-style message and verify Jonny asks for a new period/guest count instead of recreating the old booking.

## SQL Verification Queries
Find recent public conversations:

```sql
select
  id,
  owner_id,
  property_id,
  public_session_id,
  guest_name,
  guest_phone,
  status,
  related_booking_id,
  metadata,
  created_at,
  updated_at
from public.conversations
order by created_at desc
limit 20;
```

Verify successful availability and booking tool calls:

```sql
select
  id,
  conversation_id,
  tool_name,
  status,
  error_code,
  input,
  output,
  created_at
from public.ai_tool_calls
where conversation_id = '<conversation_id>'
order by created_at asc;
```

Expected:
- `check_availability` has `status = 'success'`.
- `create_pending_booking` has `status = 'success'`.
- Confirmation flow includes a final `check_availability` before `create_pending_booking`.

Verify the pending AI-chat booking:

```sql
select
  id,
  owner_id,
  property_id,
  room_id,
  conversation_id,
  guest_name,
  guest_phone,
  guest_email,
  start_date,
  end_date,
  guests_count,
  status,
  source,
  total_estimated_price,
  calendar_sync_status,
  google_calendar_event_id,
  created_at
from public.bookings
where conversation_id = '<conversation_id>'
order by created_at desc;
```

Expected:
- `status = 'pending'`.
- `source = 'ai_chat'`.
- `conversation_id` matches the public conversation.
- `calendar_sync_status = 'not_required'`.
- `google_calendar_event_id is null`.

Verify stale draft was cleared after successful booking:

```sql
select
  id,
  metadata,
  metadata ? 'booking_draft' as has_booking_draft,
  related_booking_id,
  status
from public.conversations
where id = '<conversation_id>';
```

Expected:
- `has_booking_draft = false` after successful pending booking creation.

Verify conversation messages:

```sql
select
  sender_type,
  language,
  content,
  metadata,
  created_at
from public.conversation_messages
where conversation_id = '<conversation_id>'
order by created_at asc;
```

Expected:
- Guest and Jonny messages are stored in order.
- Draft metadata appears during the in-progress flow and disappears from conversation metadata after booking creation.

## Known Remaining Risks
- Public rate limiting is still in-memory and local-process only.
- The flow is smoke-tested against a real environment, but broader Supabase integration tests/RLS tests are still limited.
- Date parsing handles the validated Romanian path, but ambiguous natural-language dates can still require Jonny to ask follow-up questions.
- AI provider behavior can vary; the backend deterministic/tool layer must remain the source of truth for booking creation.
- Public chat session state is cookie-bound; browser cookie clearing or multi-device handoff starts a separate session.
- Pending AI-chat bookings still depend on owner follow-up; no auto-confirmation is enabled.
- Email provider configuration is optional/noop-safe, so owners may see dashboard notifications without email delivery until a real provider is configured.

## Validation
- `pnpm.cmd lint`: passed.
- `pnpm.cmd typecheck`: passed.
- `pnpm.cmd test`: passed, 16 files / 76 tests.
- `pnpm.cmd build`: passed.
