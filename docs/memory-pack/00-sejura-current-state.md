# Sejura Current State

## Product
- Product name: Sejura
- Positioning: asistent de rezervari pentru pensiuni, cabane si vile locale
- Slogan: Rezervari mai simple pentru gazde locale.
- Market: Romania
- Current status: MVP pilot-ready

## MVP Summary
Sejura is a Romanian-market reservation assistant and owner dashboard for local hospitality operators. The current MVP supports owner onboarding, property/room setup, pending booking management, Google Calendar sync for confirmed bookings, a public property page, Jonny public chat, AI-assisted pending booking requests, owner notifications, QA/security hardening, and a pilot launch pack.

The accepted operating model is pending-first:
- Public guests can ask Jonny for availability.
- Jonny can create pending booking requests only.
- Owners remain responsible for confirming, rejecting, or cancelling.
- Pending AI-chat bookings do not create Google Calendar events.
- Google Calendar sync applies to confirmed bookings.

## Stack
- Next.js App Router
- TypeScript
- Tailwind CSS
- Supabase Auth
- Supabase Postgres database
- Supabase RLS
- Supabase service role for server-only public chat operations
- Vitest unit tests
- Next production build validation

## Validation Status
Latest accepted validation after Sprint 7:
- `pnpm.cmd lint`: passed.
- `pnpm.cmd typecheck`: passed.
- `pnpm.cmd test`: passed, 16 files / 78 tests.
- `pnpm.cmd build`: passed.

## Accepted Sprints 1-7
- Sprint 1 Foundation: authentication, onboarding foundation, property setup, room setup, baseline owner app shell and Supabase foundation.
- Sprint 2 Booking Core + Availability: pending/manual bookings, availability engine, booking events, room blocks, owner booking/calendar UI, overlap protection.
- Sprint 3 Google Calendar: OAuth connection, encrypted token storage, confirmed booking sync, retry/disconnect/reconnect flows.
- Sprint 4 Public Page + Jonny Runtime: public property page, Jonny chat, conversation storage, approved AI tools, pending-only AI booking path.
- Sprint 5 Notifications: owner notification system, dashboard action center, email provider abstraction, dedupe, notification APIs/pages.
- Sprint 6 QA/Security/Pilot Readiness: public chat service-role hardening, tenant boundary checks, pilot readiness and security checklists.
- Sprint 7 Pilot Launch Pack: deployment checklist, env matrix, owner onboarding script, manual smoke test, pilot launch documentation.

## Explicit Non-Scope Before Pilot Validation
Do not add WhatsApp/SMS, Stripe, payments, OTA/channel manager sync, billing, phone AI, admin platform, or mobile apps before Owner Pilot #1 validates the current MVP.
