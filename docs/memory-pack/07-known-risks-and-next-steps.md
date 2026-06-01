# Known Risks And Next Steps

## Known Risks
- Public rate limiting is in-memory and local-process only.
- Public chat guest sessions are cookie-bound and do not support cross-device handoff.
- Public chat cookies are bearer-like session tokens.
- Disposable Supabase DB/RLS integration test suite is not yet implemented.
- Email provider is noop/failure-safe unless configured.
- AI output can vary by provider behavior, so deterministic backend checks must remain authoritative.
- Romanian natural-language date parsing handles validated paths but ambiguous phrasing needs clarification.
- First pilot still needs close support and monitoring.

## Current Non-Scope
Do not add before Owner Pilot #1 validation:
- WhatsApp/SMS
- Stripe
- payments
- OTA/channel manager sync
- billing
- phone AI
- admin platform
- mobile apps
- auto-confirmed public bookings

## Recommended Next Step
Run Owner Pilot #1.

Pilot shape:
- one owner
- one property
- pending-only public booking flow
- direct support channel
- dashboard notifications as source of truth
- monitor `ai_tool_calls`, conversations, and bookings
- collect owner feedback on setup, guest flow, booking review, and operational clarity

## Pilot Success Criteria
- Owner can sign in and understand the dashboard.
- Property and rooms are correct.
- Public page can be shared.
- Jonny can create real pending booking requests.
- Owner sees and acts on pending bookings.
- Owner understands no booking is confirmed until owner action.
- Support team can diagnose issues from conversations, tool calls, and booking rows.

## After Pilot Validation
Only after the first pilot validates the MVP should the roadmap consider:
- production-grade shared rate limiting
- disposable database/RLS integration tests
- real email provider adapter
- improved owner workflow polish
- richer public copy controls
- broader pilot onboarding process

Avoid jumping to new channels or monetization before the core public pending booking workflow is proven in real owner use.
