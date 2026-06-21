# Manual Smoke Test

## Purpose
Validate the pilot deployment end to end before sharing the public property URL.

## Preconditions
- App is deployed.
- Migrations `0001` through `0007` are applied.
- Required env vars are configured.
- Pilot owner account exists, or sign-up is allowed for the dry run.
- Pilot property and at least one active room exist, or the dry run will create them.
- Public page, chat, AI booking, and public booking are enabled.
- Auto-confirmation is disabled.
- Google Calendar OAuth vars are configured if calendar connection/sync status is part of the dry run.

## Owner App Smoke
1. Open `APP_BASE_URL`.
2. If needed, sign up with the pilot owner email and complete login.
3. Sign out and sign back in to confirm login works.
4. Open `/app`.
5. Confirm dashboard renders without errors.
6. Open `/app/property`.
7. Create or update the pilot property.
8. Confirm property name, slug, check-in, check-out, public page, chat, AI booking, and public booking settings are correct.
9. Confirm auto-confirmation is disabled.
10. Open `/app/rooms`.
11. Create or update at least one active room.
12. Confirm active room inventory, capacity, and prices.
13. Open `/app/bookings`.
14. Confirm page loads and shows only pilot owner data.
15. Open `/app/notifications`.
16. Confirm page loads even if email provider vars are not configured.
17. Open `/app/settings/google-calendar`.
18. Confirm calendar sync connection/status is visible, even if not connected.

## Public Page Smoke
1. Open a signed-out browser or private window.
2. Visit `/p/[propertySlug]`.
3. Confirm public page loads.
4. Confirm Jonny chat is visible.
5. Start the conversation.
6. Confirm Jonny introduces himself as a reservation assistant.

## Public Booking Smoke
1. Send:

```text
Vreau o cazare de pe 12 06 pana pe 16 06 pentru 4 persoane.
```

2. Confirm Jonny lists available rooms.
3. Confirm Jonny says the booking will not be automatically confirmed.
4. Send a room choice, name, and phone:

```text
Aleg B parter. Numele meu este Mihai Popescu, telefon 0745123456.
```

5. Confirm Jonny summarizes the request.
6. Confirm Jonny asks for explicit confirmation.
7. Send:

```text
Da, confirm, trimite cererea.
```

8. Confirm Jonny says the request was sent and is still pending.

## Owner Follow-Up Smoke
1. Return to the owner app.
2. Open `/app/bookings`.
3. Confirm the new booking appears.
4. Confirm it is pending.
5. Open the booking detail.
6. Confirm guest name, phone, dates, room, and guest count.
7. Open `/app/notifications`.
8. Confirm a pending booking notification appears.
9. Confirm dashboard notification remains visible even if email provider vars are absent.
10. Confirm calendar sync status is visible for the pending booking or booking detail.

## SQL Verification
Tool calls:

```sql
select
  conversation_id,
  tool_name,
  status,
  error_code,
  created_at
from public.ai_tool_calls
order by created_at desc
limit 20;
```

Expected:
- `check_availability` has `status = 'success'`.
- `create_pending_booking` has `status = 'success'`.

Booking:

```sql
select
  id,
  conversation_id,
  guest_name,
  guest_phone,
  start_date,
  end_date,
  guests_count,
  status,
  source,
  calendar_sync_status,
  google_calendar_event_id,
  created_at
from public.bookings
where source = 'ai_chat'
order by created_at desc
limit 10;
```

Expected:
- `status = 'pending'`.
- `source = 'ai_chat'`.
- `conversation_id` is present.
- `calendar_sync_status` is visible and appropriate for pending mode, usually `not_required`.
- `google_calendar_event_id is null`.

Conversation:

```sql
select
  id,
  status,
  related_booking_id,
  metadata ? 'booking_draft' as has_booking_draft,
  created_at,
  updated_at
from public.conversations
order by created_at desc
limit 10;
```

Expected:
- `related_booking_id` is set after booking creation.
- `has_booking_draft = false` after successful booking creation.

## Edge-Case Smoke
- Send a fresh availability request after a draft is in progress; old room/contact should not be reused.
- Send a confirmation-style message after a successful booking; Jonny should ask for a new period and guest count.
- Choose a room that was not listed; Jonny should reject the choice.
- Disable public page or chat and confirm public access fails safely.
- Temporarily remove `OPENAI_API_KEY` only in a non-production test environment and confirm Jonny fails safely.
- For the 10-20 conversation pilot rehearsal, use `docs/public-guest-conversation-dry-run.md`.

## Pass Criteria
- Sign up and login work for the pilot owner path.
- Owner app loads.
- Property setup works.
- Rooms setup works.
- Public page loads.
- Jonny conversation starts.
- Availability check works.
- Jonny can create a pending booking request.
- Booking appears for the owner.
- Owner notification is created for the pending booking.
- Calendar sync status is visible.
- SQL confirms pending AI-chat source.
- No confirmed booking is created by Jonny.
- No Google Calendar event exists for the pending booking.

## Fail Criteria
- Owner cannot sign in.
- Public chat cannot start.
- Availability tool fails.
- Pending booking is not created.
- Booking is created as confirmed.
- Cross-owner data is visible.
- Any required validation command fails.
