# Sejura Sprint 3 Closeout

## Objective
Add Google Calendar integration so confirmed Sejura bookings can be synced safely to the owner's Google Calendar while Sejura remains the source of truth for availability, booking status, ownership, and room conflicts.

## Completed Scope
- Added Google Calendar OAuth connection flow.
- Added encrypted Google token storage helpers using AES-256-GCM.
- Added `GoogleCalendarService` for OAuth, connection status, token refresh, event create/update, cancellation marking, retry sync, test, and disconnect.
- Integrated calendar sync into booking confirmation and manual confirmed booking creation.
- Added retry sync API and booking-detail CTA for failed sync.
- Added cancellation behavior that marks the Google event as `ANULAT - Rezervare - {room} - {guest}` instead of deleting it.
- Added `/app/settings/google-calendar` Romanian owner UI.
- Added dashboard reconnect/sync warning banner.
- Added calendar sync badge and retry CTA on booking detail.
- Added safe status/test/disconnect/calendar selection APIs.
- Added tests for required/optional sync behavior, cancellation sync, token encryption, and safe connection shape.

## Changed Files
- `.env.example`
- `src/supabase/migrations/0003_google_calendar_integration.sql`
- `src/lib/supabase/database.types.ts`
- `src/domain/google-calendar/*`
- `src/domain/bookings/calendar-sync.ts`
- `src/domain/bookings/service.ts`
- `src/domain/bookings/repository.ts`
- `src/domain/bookings/memory-repository.ts`
- `src/domain/bookings/supabase-repository.ts`
- `src/domain/bookings/http.ts`
- `src/app/api/google-calendar/**/route.ts`
- `src/app/api/properties/[propertyId]/google-calendar/**/route.ts`
- `src/app/api/bookings/[bookingId]/calendar/retry-sync/route.ts`
- `src/app/api/bookings/manual/route.ts`
- `src/app/api/bookings/[bookingId]/confirm/route.ts`
- `src/app/api/bookings/[bookingId]/cancel/route.ts`
- `src/app/(protected)/app/page.tsx`
- `src/app/(protected)/app/bookings/page.tsx`
- `src/app/(protected)/app/bookings/[bookingId]/page.tsx`
- `src/app/(protected)/app/settings/google-calendar/page.tsx`
- `src/components/settings/settings-panel.tsx`
- `src/tests/unit/booking-service.test.ts`
- `src/tests/unit/google-calendar-security.test.ts`

## Database Changes
- Added `google_calendar_connections`.
- Added RLS for Google Calendar connections using `owner_id = auth.uid()`.
- Added indexes:
  - `google_calendar_connections(owner_id, property_id)`
  - `google_calendar_connections(status)`
- Added booking sync columns:
  - `calendar_sync_error_code`
  - `calendar_sync_error_message`
  - `calendar_synced_at`
- Added `property_settings.calendar_required_for_confirmation boolean not null default true`.
- Existing Sprint 2 booking data is preserved.

## Env Vars Added
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_CALENDAR_REDIRECT_URI`
- `GOOGLE_TOKEN_ENCRYPTION_KEY`

Do not use `NEXT_PUBLIC_` for Google secrets. `GOOGLE_TOKEN_ENCRYPTION_KEY` must remain server-only and should be at least 32 characters.

## Google Cloud Setup Requirements
- Create or select a Google Cloud project.
- Configure OAuth consent screen.
- Create an OAuth web client.
- Add the deployed callback URL as an authorized redirect URI.
- Set `GOOGLE_CALENDAR_REDIRECT_URI` to `/api/google-calendar/callback` on the deployed domain.
- Grant the narrow Calendar Events scope: `https://www.googleapis.com/auth/calendar.events`.

## Validation Results
- `pnpm.cmd lint`: passed.
- `pnpm.cmd typecheck`: passed.
- `pnpm.cmd test`: passed, 12 files / 47 tests.
- `pnpm.cmd build`: passed.

## Manual QA Results
- Production build confirms new Google Calendar APIs and `/app/settings/google-calendar` compile and route correctly.
- Full live OAuth QA requires valid Google OAuth credentials and a Supabase database with migration `0003_google_calendar_integration.sql` applied.
- Manual QA checklist:
  - Connect Google Calendar from `/app/settings/google-calendar`.
  - Confirm connected status appears.
  - Create or use a pending booking.
  - Confirm booking.
  - Verify Google Calendar event appears.
  - Verify event title and all-day check-in/check-out dates are correct.
  - Verify booking stores `google_calendar_event_id`.
  - Cancel booking.
  - Verify event title changes to `ANULAT`.
  - Disconnect calendar.
  - Verify status becomes disconnected.
  - Reconnect calendar.
  - Force/mock sync failure and verify booking detail shows retry.
  - Verify unauthenticated user cannot access calendar APIs.
  - Verify Owner A cannot access Owner B calendar connection.
  - Verify token values never appear in frontend responses.

## Security Notes
- Sejura database remains the source of truth.
- Google Calendar is only an operational sync layer.
- Google Calendar does not decide availability, booking status, ownership, or room conflicts.
- OAuth state is signed and time-limited.
- Owner identity is always derived from the authenticated Supabase session.
- Every Google Calendar API route verifies property/booking ownership.
- Connection status APIs return only safe data and never return raw or encrypted tokens.
- Raw Google tokens are never logged or placed in audit metadata.
- `calendar_required_for_confirmation` is respected:
  - required: sync failure keeps booking pending.
  - optional: booking may confirm with failed sync status and retry CTA.
- Repeated confirmation/update paths avoid duplicate event creation by updating/skipping when `google_calendar_event_id` exists.

## Token Storage Notes
- Access and refresh tokens are encrypted with AES-256-GCM before storage.
- Encryption uses `GOOGLE_TOKEN_ENCRYPTION_KEY`, which is server-only.
- Stored token fields:
  - `access_token_encrypted`
  - `refresh_token_encrypted`
- Decrypted tokens are used only inside server-side Google Calendar service methods.

## Known Limitations
- Calendar listing is minimal and defaults to the primary calendar.
- No bidirectional sync.
- No Google Calendar event import.
- No FreeBusy availability decisions.
- No Google Meet, guest invites, recurring bookings, iCal, OTA sync, notifications, payments, public AI runtime, or public chat.
- Live OAuth and event creation require real Google credentials, so they are documented for manual QA rather than executed in local validation.

## Bugs / Follow-ups
- Add disposable integration tests for real OAuth/token refresh with mocked Google HTTP once a test harness is available.
- Add richer owner-facing field messages on Google errors.
- Add a small admin-only operational view later if support needs sync diagnostics.

## Sprint 4 Recommendation
Sprint 4 should focus on owner-facing booking workflow polish and operational reliability: clearer failure recovery, audit visibility, and more complete manual QA automation. Keep AI/public chat, payments, OTA channels, and notifications out until calendar sync has been exercised in production-like QA.
