# Public Booking Flow

## Final Verified Jonny Flow
The public booking flow is real-smoke green:
1. Public property page loads.
2. Jonny starts a public conversation.
3. Guest sends Romanian availability request with dates and guest count.
4. Jonny parses dates/person count.
5. Jonny calls `check_availability`.
6. `check_availability` logs `success` in `ai_tool_calls`.
7. Jonny lists available rooms and states booking will not be automatically confirmed.
8. Guest chooses room and provides name plus phone/email.
9. Jonny extracts room, guest name, and contact.
10. Jonny asks explicit confirmation.
11. Guest confirms.
12. Jonny rechecks availability.
13. Jonny calls `create_pending_booking`.
14. `create_pending_booking` logs `success` in `ai_tool_calls`.
15. Pending booking appears in `bookings`.
16. Booking uses `source = 'ai_chat'`.
17. Booking is visible to owner.

## Romanian Parsing
The runtime supports the validated Romanian path, for example:

```text
Vreau o cazare de pe 12 06 pana pe 16 06 pentru 4 persoane.
```

Expected parse:
- check-in: `2026-06-12`
- check-out: `2026-06-16`
- guests: `4`

Ambiguous phrases such as `weekendul viitor` should trigger clarification instead of invented dates.

## Availability Check
Availability is backend-calculated using booking/room data. Jonny must not invent availability. Tool call:
- `check_availability`

Expected audit:
- row in `ai_tool_calls`
- `tool_name = 'check_availability'`
- `status = 'success'`
- input includes property, conversation, dates, guest count

## Room Selection
Room selection is constrained to the latest availability result in the active `booking_draft`. If a guest chooses a room not listed in the latest availability result, Jonny asks the guest to choose one of the available rooms.

## Contact Extraction
Guest contact collection accepts:
- guest name
- Romanian mobile phone such as `0745123456`
- email as an alternative contact

Jonny requires phone or email before asking final confirmation.

## Explicit Confirmation
Jonny must summarize:
- selected room
- period
- guest count
- guest name
- contact
- estimated total when available

Then Jonny asks for explicit confirmation before creating the pending booking.

## Pending Booking Creation
AI-chat booking creation:
- calls `create_pending_booking`
- creates `status = 'pending'`
- sets `source = 'ai_chat'`
- stores `conversation_id`
- does not create a Google Calendar event
- keeps `calendar_sync_status = 'not_required'`

## Stale Draft Fixes
Fixed issues:
- Fresh availability requests now clear stale selected room/contact fields.
- Successful pending booking creation clears `booking_draft`.
- A later confirmation-style message after booking creation does not recreate the old booking.
- Room choices outside the latest availability result are rejected.

## AI Tool Call Audit
Tool calls are logged in `ai_tool_calls` with:
- owner ID
- property ID
- conversation ID
- tool name
- input
- output
- status
- error code when failed
- creation timestamp

## SQL Verification Queries
Recent conversations:

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

Tool calls:

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

Pending AI-chat booking:

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

Stale draft clearance:

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

Expected after successful booking:
- `has_booking_draft = false`
- booking row is pending
- `source = 'ai_chat'`
- `google_calendar_event_id is null`
