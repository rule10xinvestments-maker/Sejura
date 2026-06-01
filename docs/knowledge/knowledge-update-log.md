# Knowledge Update Log

## Sprint 2 - Booking Core + Availability Engine
- Status: implemented and validated locally with lint, typecheck, unit tests, and production build.
- Added safe owner-only booking core with pending/manual bookings, confirm/reject/cancel flows, room blocks, booking events, and internal availability checks.
- Added RLS-backed Sprint 2 migration and Postgres exclusion constraint to prevent overlapping confirmed bookings.
- Added owner UI under `/app/bookings`, `/app/bookings/[bookingId]`, and `/app/calendar`.
- Calendar sync remains intentionally out of scope; confirmed bookings use `calendar_sync_status = 'not_required'`.
- Next step: Sprint 3 should focus on Google Calendar OAuth and event sync only, without introducing AI/public chat or payments.

## Sprint 3 - Google Calendar Integration
- Status: implemented and validated locally with lint, typecheck, unit tests, and production build.
- Added Google Calendar OAuth connection, encrypted token storage, connection status APIs, disconnect/reconnect path, retry sync, and Romanian owner UI under `/app/settings/google-calendar`.
- Integrated confirmed booking sync, optional/required calendar behavior, cancellation event marking, and owner-safe sync error display.
- Sejura remains the source of truth for availability and booking status; Google Calendar is only an operational sync layer.
- Current accepted state: Sprint 1 foundation, Sprint 2 booking/availability core, and Sprint 3 Google Calendar integration are implemented. Live OAuth QA still requires configured Google credentials and the Sprint 3 Supabase migration applied.
- Next step: Sprint 4 should improve owner workflow polish and reliability without adding AI/public chat, payments, notifications, OTA sync, or other later-scope features.

## Sprint 4 - Public Page + AI Receptionist Runtime
- Status: implemented and validated locally with lint, typecheck, unit tests, and production build.
- Added public property page `/p/[propertySlug]`, Jonny chat UI, public conversation sessions, conversation/message/tool-call storage, owner conversation views, and approved backend tool runtime.
- Jonny is positioned as an assistant of reservations, not a human or free agent.
- AI-created bookings are pending only, use `source = ai_chat`, link back to the conversation, and do not create Google Calendar events.
- Public APIs use session-bound access and do not accept `owner_id` from guests.
- Current accepted project state: Sprint 1 foundation, Sprint 2 booking/availability core, Sprint 3 Google Calendar for confirmed bookings, and Sprint 4 public assistant runtime are implemented.
- Next step: Sprint 5 should harden production rate limiting, public copy controls, model-tool orchestration tests, and safe owner handoff.

## Sprint 5 - Notifications + Owner Workflow Hardening
- Status: implemented and validated locally with lint, typecheck, unit tests, and production build.
- Added `owner_notifications`, NotificationService, email provider abstraction, dedupe keys, private notification APIs, `/app/notifications`, app-shell badges, and dashboard action-center summary.
- Booking, calendar, Google reconnect, and AI escalation events now create owner notifications with dashboard-first persistence.
- Missing email provider keys fail safely and do not break booking/chat/calendar/dashboard flows.
- `/app` remains hardened: notification/action-center failures render empty state instead of throwing.
- Current accepted project state: Sprints 1-5 are implemented through owner workflow hardening.
- Next step: Sprint 6 should add a real email provider adapter, production-grade rate limiting, automatic notification resolution, and workflow polish without adding WhatsApp/SMS/payments/OTA/admin/billing.

## Sprint 4/5 - Public Booking Flow Closeout
- Status: public Jonny booking flow is real-smoke green as of 2026-06-01; closeout captured in `docs/public-booking-flow-closeout.md`.
- Verified public page loading, Jonny conversation start, Romanian date/person extraction, availability tool logging, room/contact extraction, explicit confirmation, pending booking creation, `source = ai_chat`, and booking visibility.
- Fixed stale `booking_draft` reuse so fresh availability requests clear older room/contact details.
- Fixed post-booking stale confirmation so successful pending booking creation clears draft state and later confirmation-style messages do not recreate old bookings.
- Required migrations now include Sprint 4 public chat schema, Sprint 5 notifications, compatibility migration `0006_public_chat_schema_compatibility.sql`, and booking draft migration `0007_public_chat_booking_draft.sql`.
- Remaining risks: in-memory public rate limiting, limited Supabase integration/RLS coverage, ambiguous natural-language date handling, provider variability, cookie-bound sessions, and pending owner follow-up dependency.
