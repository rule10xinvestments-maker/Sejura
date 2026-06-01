# Security Checklist

## Status
Sprint 6 security audit completed for MVP pilot readiness.

## Authentication
- Owner app routes require authenticated Supabase user context.
- Server actions and owner APIs call `getCurrentOwnerId` before owner-scoped operations.
- Public chat endpoints do not expose owner authentication or accept `owner_id` from guests.

## Authorization / Multi-Tenant Boundaries
- Owner services scope data access by `owner_id`.
- Booking repository methods filter by `owner_id`.
- Room/property/settings services filter by `owner_id`.
- Notification service filters and updates by `owner_id`.
- Google Calendar service verifies property ownership before connection, calendar, and booking sync operations.
- Owner conversation pages filter by `owner_id`.

## Public Chat Service-Role Boundaries
- Service-role client is server-only and throws when `SUPABASE_SERVICE_ROLE_KEY` is missing.
- Public start endpoint resolves property by slug and checks public page/chat/AI booking state before creating a conversation.
- Public message endpoint requires a cookie-bound public session.
- Public message endpoint validates:
  - conversation ID
  - session token
  - property slug
  - property ID
  - current public/chat/AI booking enabled state
- Public message reads return only message fields safe for guests.
- Public message reads filter by `conversation_id`, `owner_id`, and `property_id`.
- Public chat tool calls use conversation owner/property context, not guest-supplied owner IDs.

## AI Safety
- Jonny is identified as a reservation assistant, not a human.
- Tool allowlist remains:
  - `get_property_info`
  - `list_rooms`
  - `check_availability`
  - `create_pending_booking`
  - `escalate_to_owner`
- Unknown tools are blocked.
- Jonny cannot create confirmed bookings.
- Pending booking creation rechecks availability.
- Prompt-injection attempts are handled with safe replies.
- Tool call logs store summaries and must not include secrets, tokens, prompts, or private owner data.

## Booking Safety
- AI-chat bookings are pending only.
- AI-chat bookings use `source = 'ai_chat'`.
- AI-chat bookings include `conversation_id`.
- Pending bookings do not create Google Calendar events.
- Confirm/reject/cancel operations remain owner-only.
- Availability remains backend-calculated and must not rely on model memory.

## Secrets
- Required server-only secrets must not use `NEXT_PUBLIC_`:
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `OPENAI_API_KEY`
  - `GOOGLE_CLIENT_SECRET`
  - `GOOGLE_TOKEN_ENCRYPTION_KEY`
  - `EMAIL_PROVIDER_API_KEY`
- Public client env vars are limited to:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Google tokens are encrypted at rest.
- Logs should not include tokens, service-role keys, raw OAuth credentials, full prompts, or provider secrets.

## Database / RLS
- RLS is enabled for owner data tables created through the migrations.
- Public guests do not receive direct database access to conversations, tool calls, notifications, bookings, or owner data.
- Public conversation and message writes are mediated by server-side service methods.
- Pilot database should have migrations `0001` through `0007` applied.

## Operational Controls Before Pilot
- Confirm `.env.local` contains all required pilot secrets.
- Confirm public page is enabled only for the pilot property.
- Confirm owner can log in and see bookings/notifications.
- Confirm public booking creates pending requests only.
- Confirm disabled public page returns safe unavailable state.
- Confirm error responses are guest-safe and do not expose stack traces.

## Remaining Security Risks
- Rate limiting is in-memory and local-process only.
- RLS policies need live disposable Supabase integration coverage.
- Public chat cookies are bearer-like session tokens; stolen cookies could access that guest conversation.
- AI/tool logs need periodic review as prompt and provider behavior evolves.
