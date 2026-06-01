# Sejura Sprint 5 Closeout

## Objective
Add dashboard notifications, owner email-alert plumbing, calendar error visibility, AI escalation visibility, notification deduplication, unread badges, and an owner action center so owners can act quickly on reservation events.

## Completed Scope
- Added `owner_notifications` table, enums, indexes, dedupe index, and RLS.
- Added `NotificationService` with dashboard-first persistence, dedupe keys, read/resolve actions, counts, and safe failure behavior.
- Added server-only email provider abstraction with safe noop/failure behavior when email env vars are missing.
- Added booking triggers for pending, confirmed, rejected, cancelled, and calendar sync failure notifications.
- Added Google reconnect-required notification trigger.
- Added AI escalation notification trigger.
- Added private owner notification APIs.
- Added `/app/notifications`.
- Added app-shell unread/critical badge.
- Hardened `/app` action center with fail-closed notification summary loading.
- Added conversation escalation badges.
- Added notification service and dashboard fail-closed tests.

## Changed Files
- `.env.example`
- `src/supabase/migrations/0005_owner_notifications.sql`
- `src/lib/supabase/database.types.ts`
- `src/domain/notifications/*`
- `src/domain/bookings/notifications.ts`
- `src/domain/bookings/service.ts`
- `src/domain/google-calendar/service.ts`
- `src/domain/public-chat/service.ts`
- `src/domain/dashboard/service.ts`
- `src/components/app/app-shell.tsx`
- `src/app/(protected)/layout.tsx`
- `src/app/(protected)/app/page.tsx`
- `src/app/(protected)/app/notifications/page.tsx`
- `src/app/(protected)/app/conversations/page.tsx`
- `src/app/(protected)/app/conversations/[conversationId]/page.tsx`
- `src/app/api/owner-notifications/**/route.ts`
- booking API routes and booking pages for notification injection
- `src/tests/unit/notification-service.test.ts`
- `src/tests/unit/dashboard-service.test.ts`

## Database Changes
- Added enum `notification_type`.
- Added enum `notification_status`.
- Added `owner_notifications`.
- Added RLS:
  - owners can read/update only their own notifications.
  - public guests have no direct notification access.
- Added indexes for owner/property, owner/status, owner/priority, booking, and conversation.
- Added partial unique dedupe index on unresolved `owner_id + dedupe_key`.

## Notification Types Implemented
- `booking_pending_created`
- `booking_confirmed`
- `booking_cancelled`
- `booking_rejected`
- `calendar_sync_failed`
- `google_reconnect_required`
- `ai_escalation_required`

## Email Provider Behavior
- Server-only abstraction in `EmailProvider`.
- `NoopEmailProvider` safely skips/fails when `EMAIL_PROVIDER_API_KEY` is missing.
- Dashboard notification is saved before email is attempted.
- Email failure updates notification metadata with `EMAIL_PROVIDER_NOT_CONFIGURED` or safe error code.
- Email failure does not break booking, calendar, chat, or dashboard flows.

## Deduplication Rules
- Uses `dedupe_key` and a partial unique DB index for unresolved notifications.
- Examples:
  - `booking_pending_created:{bookingId}`
  - `booking_confirmed:{bookingId}`
  - `booking_rejected:{bookingId}`
  - `booking_cancelled:{bookingId}`
  - `calendar_sync_failed:{bookingId}:{error}`
  - `google_reconnect_required:{propertyId}`
  - `ai_escalation_required:{conversationId}`
- Repeated unresolved notifications update existing rows instead of creating duplicates.

## Dashboard / Action Center Changes
- `/app` shows action count and recent action links.
- App shell shows unread or critical notification badge.
- Notification summary loading fails closed to empty counts/items.
- Missing `owner_notifications` table or failed query does not crash `/app`.

## Validation Results
- `pnpm.cmd lint`: passed.
- `pnpm.cmd typecheck`: passed.
- `pnpm.cmd test`: passed, 15 files / 58 tests.
- `pnpm.cmd build`: passed.

## Manual QA Results
- Production build validates notification routes/pages compile.
- Full manual QA requires migration `0005_owner_notifications.sql` applied.
- Manual QA checklist:
  - Create pending booking from Jonny public chat.
  - Confirm owner receives dashboard notification.
  - Confirm owner receives email or safe email failure/skipped status.
  - Confirm pending notification says `In asteptare`, not `Confirmata`.
  - Open notification and navigate to booking detail.
  - Confirm booking and verify confirmed notification appears.
  - Force/mock Google Calendar sync failure and verify critical notification.
  - Force/mock Google reconnect required and verify persistent reconnect notification.
  - Escalate AI conversation and verify escalation notification.
  - Mark notification as read and verify unread count changes.
  - Verify Owner A cannot see Owner B notifications.
  - Verify public guest cannot access notification endpoints.
  - Verify `/app` still renders if notification query fails.

## Security Notes
- `owner_id` comes from authenticated session in APIs.
- Public guests cannot access notification APIs.
- Cross-owner notification updates are blocked by owner-scoped queries and RLS.
- No tokens, secrets, raw provider responses, stack traces, full AI prompts, or unrelated owner data are included in notifications or email payloads.
- Pending notifications clearly say `In asteptare`.
- Notification failures are non-critical and do not hard-crash `/app`.

## Known Limitations
- Email provider is a safe noop/failure wrapper until a real provider adapter is configured.
- Notification counts are loaded by querying notification rows, not a materialized counter.
- Critical notifications can be manually resolved; automatic source-state resolution can be expanded later.
- No WhatsApp, SMS, native push, phone AI, payments, OTA sync, admin platform, or billing automation.

## Bugs / Follow-ups
- Add a real provider adapter after choosing email vendor.
- Add automatic resolution for Google reconnect notifications when status returns to connected.
- Add richer action-center grouping once more event volume exists.
- Add integration tests against Supabase for RLS policies.

## Sprint 6 Recommendation
Sprint 6 should focus on operational polish: real email adapter, production rate limiting, better notification grouping, automatic resolution, and owner-facing workflow refinements. Keep WhatsApp/SMS/payments/OTA/admin/billing out of scope until the reservation workflow is stable.
