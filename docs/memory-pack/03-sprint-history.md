# Sprint History

## Sprint 1 - Foundation
Objective:
- Establish the Sejura foundation for authenticated owners, property setup, room setup, and safe Supabase-backed ownership.

Delivered:
- Owner authentication foundation.
- App shell and protected owner area.
- Property onboarding/setup.
- Room setup and listing.
- Initial Supabase tables, policies, generated types, and validation patterns.

Bugs fixed:
- Early setup and ownership edge cases were stabilized as later sprints built on the foundation.

Validation result:
- Accepted as the foundation for later sprints.

## Sprint 2 - Booking Core + Availability
Objective:
- Add safe owner-only booking core and internal availability engine.

Delivered:
- Pending/manual bookings.
- Confirm/reject/cancel flows.
- Booking events.
- Room blocks.
- Owner booking list/detail and calendar UI.
- Availability checks.
- Postgres exclusion constraint to prevent overlapping confirmed bookings.

Bugs fixed:
- Availability and booking ownership boundaries were tested.
- Confirmed bookings use `calendar_sync_status = 'not_required'` before Sprint 3 calendar integration.

Validation result:
- Passed lint, typecheck, unit tests, and production build.

## Sprint 3 - Google Calendar
Objective:
- Add Google Calendar OAuth and confirmed booking sync.

Delivered:
- Google OAuth connection.
- Encrypted token storage.
- Connection status APIs.
- Disconnect/reconnect.
- Retry sync.
- Romanian owner UI under `/app/settings/google-calendar`.
- Confirmed booking sync and cancellation event marking.

Bugs fixed:
- Owner-safe sync error visibility.
- Sejura remains the source of truth; Google Calendar is an operational sync layer only.

Validation result:
- Passed lint, typecheck, unit tests, and production build.

## Sprint 4 - Public Page + Jonny Runtime
Objective:
- Build public property page and Jonny AI reservation assistant runtime.

Delivered:
- Public route `/p/[propertySlug]`.
- Jonny chat UI.
- Public conversation session model with httpOnly cookie.
- Public conversation APIs.
- `conversations`, `conversation_messages`, and `ai_tool_calls`.
- Owner conversation views.
- Jonny runtime with assistant identity, prompt-injection rules, tool allowlist, tool-call logging, language detection.
- Pending-only AI booking path.

Bugs fixed:
- Public APIs do not accept `owner_id` from guests.
- Jonny cannot create confirmed bookings.
- Safe fallback when `OPENAI_API_KEY` is missing.

Validation result:
- Passed lint, typecheck, unit tests, and production build.

## Sprint 5 - Notifications
Objective:
- Add owner notifications and workflow hardening.

Delivered:
- `owner_notifications`.
- `NotificationService`.
- Email provider abstraction.
- Dedupe keys.
- Private notification APIs.
- `/app/notifications`.
- App-shell badges and dashboard action center.
- Booking/calendar/AI escalation notification triggers.

Bugs fixed:
- Notification failures do not break booking/chat/calendar/dashboard flows.
- `/app` fails closed to empty notification state instead of crashing.

Validation result:
- Passed lint, typecheck, unit tests, and production build.

## Sprint 6 - QA/Security/Pilot Readiness
Objective:
- Stabilize and harden MVP for first pilot owner use.

Delivered:
- QA hardening audit.
- Security boundary audit.
- Public chat and booking edge-case review.
- Multi-tenant and service-role verification.
- Regression coverage expansion.
- Security and pilot readiness checklists.

Bugs fixed:
- Public conversation validation now binds `conversation_id`, public session, and requested `property_slug`.
- Public message reads now filter by `conversation_id`, `owner_id`, and `property_id`.
- Conversation last-message updates now filter by conversation, owner, and property.
- Session resume ignores soft-deleted conversations.

Validation result:
- Passed lint, typecheck, 16 files / 78 tests, and production build.

## Sprint 7 - Pilot Launch Pack
Objective:
- Prepare Sejura for first real pilot owner.

Delivered:
- Pilot launch pack.
- Deployment checklist.
- Environment matrix.
- Owner onboarding script.
- Manual smoke test.
- Migration, rollback, demo/seed, limitations, and support notes.

Bugs fixed:
- No runtime bugs fixed in Sprint 7; documentation-only launch readiness sprint.

Validation result:
- Passed lint, typecheck, 16 files / 78 tests, and production build.
