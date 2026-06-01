# Pilot Readiness Checklist

## Goal
Prepare Sejura MVP for first pilot owner use with the existing pending-booking workflow.

## Pilot Preconditions
- Supabase project is reachable.
- Migrations `0001` through `0007` are applied.
- Owner account exists and can sign in.
- Pilot property exists with:
  - name
  - slug
  - check-in/check-out times
  - public page enabled
  - chat enabled
  - AI booking enabled
  - public booking enabled
  - auto-confirmation disabled
- At least one active room exists with max guests and price.
- `OPENAI_API_KEY` is configured for Jonny.
- `SUPABASE_SERVICE_ROLE_KEY` is configured server-side.

## Environment Checklist
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`
- `APP_BASE_URL`
- Optional email settings configured or explicitly accepted as noop-safe:
  - `EMAIL_PROVIDER`
  - `EMAIL_PROVIDER_API_KEY`
  - `EMAIL_FROM_ADDRESS`
  - `EMAIL_FROM_NAME`

## Owner Smoke
- Sign in as pilot owner.
- Open `/app`.
- Confirm dashboard renders.
- Open `/app/property`.
- Confirm public page details are correct.
- Open `/app/rooms`.
- Confirm room inventory is correct.
- Open `/app/bookings`.
- Confirm no cross-owner data appears.
- Open `/app/notifications`.
- Confirm page renders even if email provider is not configured.

## Public Guest Smoke
- Open `/p/[propertySlug]` signed out or in a clean browser session.
- Confirm public page loads.
- Start Jonny chat.
- Ask in Romanian for availability with exact dates and guest count.
- Confirm Jonny lists available rooms.
- Choose a listed room and provide guest name plus phone or email.
- Confirm Jonny asks for explicit final confirmation.
- Confirm the request.
- Confirm Jonny says the request is pending and not confirmed.

## Owner Follow-Up Smoke
- Open `/app/bookings`.
- Confirm the AI-chat booking appears as pending.
- Confirm `source = ai_chat` in database verification when needed.
- Confirm no Google Calendar event exists while pending.
- Confirm owner notification exists for pending booking when notifications are enabled.
- Confirm owner can confirm, reject, or cancel from the protected owner flow.

## Database Verification
Check recent tool calls:

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

Check pending AI-chat booking:

```sql
select
  id,
  conversation_id,
  status,
  source,
  calendar_sync_status,
  google_calendar_event_id,
  created_at
from public.bookings
where source = 'ai_chat'
order by created_at desc
limit 20;
```

Check stale draft clearance:

```sql
select
  id,
  metadata ? 'booking_draft' as has_booking_draft,
  related_booking_id,
  status
from public.conversations
order by created_at desc
limit 20;
```

## Edge Cases To Recheck
- Disabled public page.
- Public page enabled but chat disabled.
- AI booking disabled.
- Missing `OPENAI_API_KEY`.
- Ambiguous Romanian date such as `weekendul viitor`.
- Fresh availability request after an in-progress draft.
- Confirmation-style message after a successful booking.
- Room choice outside the latest availability result.
- Notification insert failure does not block booking.

## Go / No-Go
Go for first pilot only if:
- Public smoke passes end to end.
- Owner can see and act on pending bookings.
- Lint, typecheck, tests, and build pass.
- Public chat service-role boundary tests pass.
- Pilot owner understands bookings are pending until owner action.

No-go if:
- Public chat can expose another conversation.
- Pending booking creation fails silently.
- Owner cannot see pending booking requests.
- Build or typecheck fails.
- Required env vars or migrations are missing.

## Pilot Support Notes
- Keep first pilot to one owner/property.
- Keep public booking mode pending-only.
- Watch public chat errors and `ai_tool_calls` during the first live sessions.
- Use dashboard notifications as the source of truth if email is not configured.
- Keep a direct owner support channel during pilot day.
