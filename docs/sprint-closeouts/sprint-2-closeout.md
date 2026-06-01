# Sejura Sprint 2 Closeout

## Objective
Build the safe booking core and availability engine for Romanian accommodation owners: manual bookings, pending requests, confirm/reject/cancel actions, room blocks, tenant-safe access, and double-booking prevention.

## Completed Scope
- Added booking domain services:
  - `AvailabilityService.checkAvailability`
  - `BookingService.createPendingBooking`
  - `BookingService.createManualBooking`
  - `BookingService.confirmBooking`
  - `BookingService.rejectBooking`
  - `BookingService.cancelBooking`
  - `RoomBlockService.createRoomBlock`
  - `RoomBlockService.updateRoomBlock`
  - `RoomBlockService.deleteRoomBlock`
- Added owner-scoped Supabase repository for bookings, booking events, room blocks, properties, and rooms.
- Added API routes for availability checks, booking list/detail, manual and pending booking creation, booking status actions, and room block CRUD.
- Added Romanian owner UI:
  - `/app/bookings`
  - `/app/bookings/[bookingId]`
  - `/app/calendar`
- Added navigation links for Rezervari and Calendar intern.
- Added unit coverage for availability rules, overlap handling, room blocks, status transitions, cross-owner safety, and ignoring client-provided owner identity.
- Kept confirmed bookings with `calendar_sync_status = 'not_required'`.

## Changed Files
- `src/supabase/migrations/0002_booking_core_availability.sql`
- `src/lib/supabase/database.types.ts`
- `src/domain/bookings/*`
- `src/app/api/availability/check/route.ts`
- `src/app/api/bookings/**/route.ts`
- `src/app/api/room-blocks/**/route.ts`
- `src/app/(protected)/app/bookings/page.tsx`
- `src/app/(protected)/app/bookings/[bookingId]/page.tsx`
- `src/app/(protected)/app/calendar/page.tsx`
- `src/app/(protected)/app/page.tsx`
- `src/components/app/app-shell.tsx`
- `src/tests/unit/booking-service.test.ts`

## Database Changes
- Added enums:
  - `booking_status`
  - `booking_source`
  - `audit_actor_type`
  - `calendar_sync_status`
- Added tenant tables:
  - `bookings`
  - `booking_events`
  - `room_blocks`
  - `audit_logs`
- Enabled RLS on all new tenant tables.
- Added owner-only policies using `owner_id = auth.uid()`.
- Added availability indexes for bookings, room blocks, and rooms.
- Added PostgreSQL exclusion constraint `no_overlapping_confirmed_bookings` for confirmed, non-deleted booking overlaps.
- Added update timestamp triggers and owner immutability triggers where applicable.

## Validation Results
- `pnpm.cmd lint`: passed.
- `pnpm.cmd test`: passed, 11 files / 41 tests.
- `pnpm.cmd build`: passed.
- `pnpm.cmd typecheck`: passed.
- Note: one earlier parallel typecheck run failed because Next was regenerating `.next/types` during build; rerunning typecheck by itself passed.

## Manual QA Results
- Production build confirms the new `/app/bookings`, `/app/bookings/[bookingId]`, `/app/calendar`, and API routes compile and generate correctly.
- Local route smoke:
  - `/sign-in` returned 200.
  - `/app/bookings` returned a protected 307 redirect to `/sign-in` without a session.
- Browser-level authenticated QA still requires a configured Supabase project with Sprint 2 migration applied and an owner session.
- Expected manual QA checklist:
  - `/app` loads with booking navigation.
  - `/app/bookings` loads after property and rooms exist.
  - Owner can create a confirmed manual booking.
  - Owner can create a pending booking.
  - Pending booking can be confirmed or rejected.
  - Confirmed booking can be cancelled.
  - `/app/calendar` can create and remove room blocks.
  - Overlapping confirmed bookings and room blocks block availability.

## Security Notes
- `owner_id` is derived from the authenticated Supabase session in server routes and server actions.
- API and server actions do not trust `owner_id` from request body or forms.
- Repository queries are owner-scoped and remain backed by Supabase RLS.
- Room and property ownership are checked before bookings or room blocks are created.
- Rejected and cancelled bookings are retained for history and no longer block availability.
- Confirming a pending booking re-checks availability immediately before status update.
- PostgreSQL exclusion constraint protects against overlapping confirmed bookings under concurrent writes.
- No service role key is exposed to frontend code.

## Known Limitations
- Sprint 2 does not include Google Calendar OAuth or external calendar sync.
- Sprint 2 does not include AI runtime, public chat, notifications, payments, OTA sync, or billing.
- UI uses a simple internal list/calendar view, not a full visual calendar grid.
- Manual authenticated QA depends on applying the Sprint 2 migration in the target Supabase database.

## Bugs / Follow-ups
- Add integration tests against a disposable Supabase/Postgres database when available.
- Add richer field-level errors on booking and room block server actions; current page-level Romanian messages are safe but minimal.
- Consider a database RPC transaction for confirmation if future flows add more side effects around status changes.

## Sprint 3 Recommendation
Start Sprint 3 with calendar integration only after the booking core remains stable: Google Calendar OAuth, calendar connection status, calendar event creation for confirmed bookings, reconnect handling, and tests for sync failure states. Keep AI/public chat out until the calendar integration is reliable.
