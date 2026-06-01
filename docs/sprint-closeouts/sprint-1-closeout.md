# Sprint 1 Closeout

## Objective

Build the safe foundation for Sejura, an asistent de rezervari pentru pensiuni, cabane si vile locale, without booking, calendar, payment, notification, public chat, or AI runtime features.

## Implemented Scope Checklist

- [x] Next.js App Router foundation with TypeScript, `src` directory, Tailwind, ESLint, and `@/*` alias.
- [x] Supabase browser/server helpers using `@supabase/ssr`.
- [x] Supabase Auth sign-up, sign-in, and sign-out screens.
- [x] Optional Google Sign-In for owner authentication through Supabase Auth.
- [x] Protected `/app` shell with server-side auth guard.
- [x] Owner profile creation on first protected login.
- [x] Property create/edit UI.
- [x] Default property settings creation.
- [x] Property public page placeholder creation with public/chat disabled.
- [x] Rooms list/create/edit/deactivate UI for physical reservable units.
- [x] Basic onboarding flow: property details -> first room -> activation check.
- [x] Activation check service with missing requirements.
- [x] Romanian-first, owner-focused, mobile-first dashboard and app screens.
- [x] RLS migration for owners, properties, property_settings, rooms, and property_public_pages.
- [x] Unit tests for validation, activation, and ownership helpers.
- [x] Unit tests for Google auth button rendering and missing-code callback handling.
- [x] E2E smoke coverage for landing/auth/protected route, with full onboarding gated by Supabase test env.

## Changed Files

- `package.json`
- `next.config.mjs`
- `tsconfig.json`
- `.eslintrc.json`
- `.gitignore`
- `postcss.config.mjs`
- `tailwind.config.ts`
- `vitest.config.ts`
- `playwright.config.ts`
- `.env.example`
- `src/middleware.ts`
- `src/app/auth/callback/route.ts`
- `src/app/**`
- `src/components/**`
- `src/domain/**`
- `src/lib/**`
- `src/lib/supabase/types.ts`
- `src/supabase/migrations/0001_sprint1_foundation.sql`
- `src/tests/**`
- `docs/sprint-closeouts/sprint-1-closeout.md`

## Google Owner Login

On 2026-05-24, optional Google Sign-In was added to the Sprint 1 auth flow. This uses Supabase Auth with `provider: "google"` and redirects through `/auth/callback?next=/app`, where the OAuth code is exchanged for a Supabase session.

Scope notes:

- Google login is only an owner authentication method.
- Owner profile creation still happens server-side on first protected `/app` access.
- Google Calendar OAuth was not added.
- No calendar scopes, calendar tables, bookings, public booking flow, notifications, payments, or AI runtime were added.

## Auth Test Fix

On 2026-05-24, `src/tests/unit/auth-form.test.tsx` was updated to import React explicitly. This fixes the `ReferenceError: React is not defined` failure when Vitest renders JSX in the auth form unit tests.

## Password Confirmation UX

On 2026-05-31, the auth form was improved for safer account creation:

- `/sign-up` now shows `Email`, `Parolă`, and `Confirmă parola`.
- Sign-up blocks mismatched passwords with `Parolele nu coincid.`
- `/sign-in` remains simple with only `Email` and `Parolă`.
- Password fields have show/hide controls with non-submit buttons and accessible labels.
- Password inputs use the correct autocomplete values for sign-up and sign-in.
- Google login remains visible on both auth screens.

## Owner-Friendly Public Link

On 2026-05-31, the property setup form was updated so owners no longer need to understand or type a technical slug:

- The main property form no longer shows `Slug public rezervat`.
- The app generates the slug automatically from the property name.
- The form shows a friendly reserved public address preview as `/p/{generatedSlug}`.
- Helper text explains: `Îl vom folosi mai târziu pentru pagina publică a pensiunii.`
- Slug uniqueness stays server-side through generated suffixes and the database unique constraint.
- Slug editing was not added to the main setup flow; it remains a later Public Page settings concern.

## Onboarding Runtime Fix

On 2026-05-31, manual QA found a client-side exception on `/app/onboarding` after the owner-friendly slug update. The hardening fix included:

- Added the missing React runtime import to `OnboardingFlow`, matching the JSX runtime behavior already handled in other tested components.
- Made `generatePropertySlug` safe for empty, null, or undefined input.
- Changed the property form so empty names show `Îl vom genera automat din numele proprietății.` instead of rendering a placeholder `/p/proprietate`.
- Kept the friendly preview as `Link public rezervat: /p/{slug}` only when there is an existing slug or a typed property name.
- Made property settings lookup tolerate a missing row so onboarding can show the activation requirement instead of throwing.

## Rooms Validation Runtime Fix

On 2026-05-31, manual QA found a runtime error on `/app/rooms` caused by raw `roomFormSchema.parse(...)` throwing a Zod error during expected user-input validation. The fix changed room saving to use `safeParse` and return Romanian validation state to the form instead of throwing into the Next.js runtime overlay.

Files changed:

- `src/app/(protected)/app/rooms/page.tsx`
- `src/components/rooms/room-form.tsx`
- `src/components/rooms/rooms-list.tsx`
- `src/domain/rooms/form-state.ts`
- `src/domain/rooms/schemas.ts`
- `src/domain/rooms/service.ts`
- `src/domain/rooms/types.ts`
- `src/tests/unit/room-form.test.tsx`
- `src/tests/unit/rooms-list.test.tsx`
- `src/tests/unit/room-service.test.ts`

Safety notes:

- `owner_id` still comes from the authenticated Supabase session.
- `property_id` ownership checks remain in the room service.
- The client still never sends or controls `owner_id`.
- No booking, availability, AI, calendar, notification, payment, or Sprint 2 feature work was added.

## Rooms UX Copy And Feedback

On 2026-06-01, the rooms form copy was adjusted after manual QA:

- New room submit now says `Salvează camera`.
- Edit room submit now says `Salvează modificările`.
- Successful create/update/deactivate flows show friendly Romanian feedback:
  - `Camera a fost salvată.`
  - `Camera a fost actualizată.`
  - `Camera a fost dezactivată.`
- The room form remains limited to name, max guests, base nightly price, and status.
- Deactivate remains in its own form with a submit button, separate from edit forms.

## Property Time Validation Runtime Fix

On 2026-06-01, manual QA found a runtime error on `/app/property` when localized time values such as `03:00 PM` and `11:00 AM` reached `propertyFormSchema.parse(...)`, which expected strict `HH:mm` values. The fix changed property saving to use `safeParse`, normalize time input before validation, and return Romanian field/form errors to the property form instead of throwing raw Zod errors.

Files changed:

- `src/app/(protected)/app/property/page.tsx`
- `src/components/property/property-form.tsx`
- `src/domain/properties/form-state.ts`
- `src/domain/properties/schemas.ts`
- `src/domain/properties/time.ts`
- `src/tests/unit/property-form.test.tsx`
- `src/tests/unit/property-service.test.ts`

Safety notes:

- Time defaults remain `15:00` for check-in and `11:00` for check-out.
- Server-side validation remains authoritative.
- Slug generation remains automatic from property name.
- `owner_id` still comes from the authenticated Supabase session, never from client input.
- No booking, availability, AI, calendar, notification, payment, or Sprint 2 feature work was added.

## Property Form State Runtime Fix

On 2026-06-01, manual QA found a `Cannot read properties of undefined (reading 'errors')` crash in `PropertyForm`. The cause was that the client form stored the raw action result, and a redirect/action wiring path could leave the local form state undefined. The fix introduced one predictable property form state shape with `ok`, `errors`, `message`, and `values`, plus a shared `PROPERTY_FORM_INITIAL_STATE`. The component now falls back to that initial state and reads errors safely.

Files changed:

- `src/app/(protected)/app/property/page.tsx`
- `src/components/property/property-form.tsx`
- `src/domain/properties/form-state.ts`
- `src/tests/unit/property-form.test.tsx`

Safety notes:

- Expected validation errors render as Romanian messages instead of crashing.
- Slug generation and time normalization remain unchanged.
- `owner_id` still comes from the authenticated Supabase session, never from client input.
- No booking, availability, AI, calendar, notification, payment, or Sprint 2 feature work was added.

## TypeScript / Supabase Client Typing Fix

On 2026-05-24, the Sprint 1 build was blocked by a Supabase client type mismatch. The service functions used local `SupabaseClient<Database>` aliases, while `@supabase/ssr@0.5.2` returned a client type shaped like an older three-generic `SupabaseClient` against the installed newer `@supabase/supabase-js@2.106.1` four-generic type.

Fixes applied:

- Added `src/lib/supabase/types.ts` with a single shared `AppSupabaseClient` type.
- Updated owner, property, room, and settings services to accept `AppSupabaseClient`.
- Annotated browser and server Supabase helper return types as `AppSupabaseClient`.
- Kept the compatibility cast only inside the Supabase client factory boundary.
- Added `Relationships: []` metadata to local database table types so the schema satisfies Supabase's generated type shape.
- Added explicit cookie batch parameter typing in Supabase server and middleware helpers.

## Database Changes

- Added `owners`, linked one-to-one to `auth.users`.
- Added `properties` with owner ownership, slug, status, contact details, check-in/check-out, and rules.
- Added `property_settings` with Sprint 1 safe defaults and check constraints forcing `ai_enabled`, `public_booking_enabled`, and `allow_auto_confirmation` to remain false.
- Added `rooms` as physical reservable units with owner/property ownership, capacity, base price, and active/inactive status.
- Added `property_public_pages` placeholder table with check constraints forcing `is_public` and `chat_enabled` false.
- Enabled RLS on all Sprint 1 tenant tables.
- Added owner-scoped policies using `auth.uid()`.
- Added composite property/owner foreign keys so settings, rooms, and public page placeholders cannot point at another owner's property.
- Added a database trigger enforcing the maximum of 3 properties per owner.
- Added update timestamp triggers and owner_id immutability triggers for tenant-owned tables.

## Validation Results

Validation commands requested:

- `pnpm.cmd lint`
- `pnpm.cmd typecheck`
- `pnpm.cmd test`
- `pnpm.cmd build`

Current local result:

- `pnpm.cmd lint`: passed with no ESLint warnings or errors.
- `pnpm.cmd typecheck`: passed.
- `pnpm.cmd test`: passed, 10 test files and 29 tests.
- `pnpm.cmd build`: passed.

Note: initial parallel typecheck attempts can fail while `.next/types` is being regenerated by build. Standalone reruns passed.

## Manual QA Results

Manual browser QA was not run because the app cannot be started without available Node/pnpm tooling in this environment.

Planned manual QA once dependencies are installed:

- Visit `/` and confirm Sejura is positioned as an assistant for local accommodation owners.
- Confirm `/sign-in` and `/sign-up` show `Continuă cu Google`.
- Visit `/app` while signed out and confirm redirect to `/sign-in`.
- Sign up with Supabase Auth and confirm protected app access.
- Confirm owner profile row is created.
- Create property and confirm settings and public page placeholder rows are created.
- Create, edit, and deactivate a room.
- Confirm activation check changes from missing requirements to ready after basic setup.
- Confirm settings remain disabled for AI, public booking, and auto-confirmation.

Latest local manual route smoke, 2026-05-31:

- Dev server started on `http://127.0.0.1:3000`.
- `/sign-in` returned 200.
- `/app`, `/app/onboarding`, `/app/property`, and `/app/rooms` redirected to `/sign-in` when unauthenticated.
- Authenticated save/add-room manual QA was not run because no E2E owner credentials are present in `.env.local`.

Latest local manual route smoke, 2026-06-01:

- Dev server started on `http://127.0.0.1:3000`.
- `/sign-in` returned 200.
- `/app/property`, `/app/onboarding`, and `/app/rooms` redirected to `/sign-in` when unauthenticated.
- Authenticated property save, empty-form validation, and room add/edit/deactivate QA were not run because no E2E owner credentials are present in `.env.local`.

## Known Limitations

- Full E2E onboarding requires Supabase project env vars plus test owner credentials.
- Error rendering for failed server actions is intentionally minimal in Sprint 1.
- The app currently focuses the first-property onboarding flow, while the database and service guard enforce the maximum of 3 properties.

## Security Notes

- Client-provided `owner_id` is never accepted by forms.
- Server actions derive owner identity from the authenticated Supabase session.
- Private read/write queries include owner filters.
- RLS is enabled on all Sprint 1 tenant tables.
- Service role key is not used or exposed.
- Sprint 1 database constraints keep AI, public booking, public page, chat, and auto-confirmation disabled.
- Google Sign-In does not request calendar scopes and does not add Google Calendar OAuth.

## Bugs / Follow-ups

- Configure the Google provider in Supabase Auth before manual OAuth QA.
- Add richer server-action error states after the foundation is validated.
- Add integration tests against a local Supabase database for RLS behavior.
- Expand UI for managing up to 3 properties after the initial owner flow is stable.

## Acceptance Status

Sprint 1 foundation validation is accepted for the current scope: lint, typecheck, unit tests, and build pass after the password confirmation UX update.

## Sprint 2 Recommendation

Sprint 2 should keep the same safety posture and add the next operational reservation primitives before any AI: bookings, availability rules, manual booking management, and audit-friendly reservation events. AI and calendar integrations should wait until the booking model and tenant isolation have integration coverage.
