# Sprint 6 Plan - QA + Security + Pilot Readiness

## Objective
Stabilize and harden the Sejura MVP for first pilot owner use.

Sprint 6 is a QA/security/readiness sprint. It must not add payments, Stripe, new booking features, calendar expansion, billing, or mobile apps.

## Scope
- QA hardening audit.
- Security boundary audit.
- Public chat and booking flow edge-case review.
- Multi-tenant and service-role verification.
- Regression coverage expansion for pilot-critical flows.
- Pilot owner readiness checklist.

## Non-Goals
- Payments or Stripe.
- New booking features.
- Google Calendar expansion.
- Billing.
- Mobile apps.
- OTA/channel manager integrations.
- WhatsApp/SMS/phone AI.
- Admin platform.

## Audit Results
### QA Hardening
- Public page load, conversation start, Romanian extraction, availability checks, pending booking creation, and owner booking visibility were already smoke green.
- Existing regression coverage covered stale draft reuse, post-booking stale confirmation, notification failure tolerance, booking source, pending-only AI bookings, and calendar non-sync for pending requests.
- Added additional coverage for property slug/session binding and owner/property-scoped public message reads.

### Security Boundaries
- Owner/private routes use authenticated owner identity from `getCurrentOwnerId`.
- Booking, room, notification, Google Calendar, dashboard, and property services consistently scope reads/writes by `owner_id`.
- Public chat routes intentionally use `SUPABASE_SERVICE_ROLE_KEY`, so service methods must enforce session, property, and owner boundaries in code.
- Found one boundary hardening gap: public conversation validation checked `conversation_id` and `public_session_id`, but did not require the request `property_slug` to match the conversation property.

### Public Chat + Booking Edge Cases
- Fresh availability requests clear stale room/contact state.
- Room selection is limited to the latest availability result.
- Explicit confirmation rechecks availability before booking creation.
- Pending bookings created by Jonny use `source = 'ai_chat'`, `status = 'pending'`, and no Google Calendar event.
- Successful pending booking clears `booking_draft`, preventing stale follow-up confirmation from recreating the old request.
- Remaining parser risk: ambiguous Romanian natural language still needs follow-up questions.

### Multi-Tenant + Service-Role Verification
- Public service-role usage is currently limited to:
  - `/p/[propertySlug]`
  - `/api/public/conversations/start`
  - `/api/public/conversations/message`
  - `/api/public/conversations/[conversationId]/messages`
- Service-role public message validation now binds:
  - `conversation_id`
  - `public_session_id`
  - `property_slug -> property_id`
  - current public page/chat/AI booking enabled state
- Public message listing now filters by `conversation_id`, `owner_id`, and `property_id`.
- Conversation last-message updates now filter by `id`, `owner_id`, and `property_id`.
- Existing session resume ignores soft-deleted conversations.

## Bugs Found
- Public conversation access was not explicitly bound to the requested `property_slug` once a conversation/session pair was supplied.
- Public message listing depended on prior conversation validation and only filtered by `conversation_id`.
- Conversation last-message updates only filtered by conversation ID.
- Soft-deleted conversations could be considered for public session resume.

## Root Causes
- Public chat routes rely on a service-role Supabase client to support unauthenticated guest conversations.
- Some service methods assumed the validated conversation object was enough context for follow-on operations.
- The initial Sprint 4 implementation prioritized getting the public conversation flow working and did not fully duplicate tenant filters on every service-role query.

## Fixes
- `PublicConversationService.validateConversation` now resolves the requested `property_slug`, verifies the public page is still enabled/setup-ready, and filters the conversation by that property ID.
- `listMessages` now filters by conversation, owner, and property.
- `saveMessage` last-message update now filters by conversation, owner, and property.
- Session resume now ignores `deleted_at` conversations.
- Added regression tests for wrong property slug denial and owner/property-scoped message reads.

## Regression Coverage Added
- Public conversation access rejects a valid session/conversation pair when `property_slug` does not match the conversation property.
- Public message listing returns only rows matching the validated conversation owner and property.

## Required Validation
- `pnpm.cmd lint`
- `pnpm.cmd typecheck`
- `pnpm.cmd test`
- `pnpm.cmd build`

## Validation Results
- `pnpm.cmd lint`: passed.
- `pnpm.cmd typecheck`: passed.
- `pnpm.cmd test`: passed, 16 files / 78 tests.
- `pnpm.cmd build`: passed.

## Closeout Summary
Sprint 6 stabilized the public booking MVP for first pilot owner use by auditing QA, security, public chat edge cases, multi-tenant boundaries, and service-role usage. One service-role boundary gap was found and fixed: public conversation access is now explicitly tied to the requested property slug and current public booking state, and public message reads/updates have additional owner/property filters. Regression coverage was expanded for these pilot-critical boundaries.

The MVP remains pending-booking only. No payments, Stripe, billing, new booking features, calendar expansion, or mobile apps were added.

## Remaining Risks
- Public rate limiting is still in-memory and should be replaced before broader launch.
- Supabase RLS and migration behavior still need disposable database integration tests.
- Public chat is cookie-session based; cross-device handoff is not supported.
- AI output can vary, so deterministic backend checks must remain authoritative.
- Email provider is noop/failure-safe until configured; dashboard notifications are the reliable pilot signal.
- Manual pilot runbooks should include seed data, owner login, public URL, and clear rollback/contact path.
