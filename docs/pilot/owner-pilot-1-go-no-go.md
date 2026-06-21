# Owner Pilot #1 Go/No-Go Report

## Recommendation
**CONDITIONAL GO for Owner Pilot #1 dry run and controlled live owner usage.**

Proceed only after the deployment environment is configured, migrations are applied, and the manual dry-run checklist passes in the deployed pilot environment. Automated validation is green, and no remaining code-level P0/P1 blocker was found in this readiness pass.

## Validation Results
Run on 2026-06-02:

| Command | Result |
| --- | --- |
| `pnpm.cmd lint` | Passed |
| `pnpm.cmd typecheck` | Passed |
| `pnpm.cmd test` | Passed: 16 test files, 96 tests |
| `pnpm.cmd build` | Passed |

Known non-blocking test output:
- `rooms-list.test.tsx` still emits a React warning for a server-action `form action` prop in the test renderer. It does not fail lint, typecheck, tests, or build.

## Readiness Review

| Area | Status | Notes |
| --- | --- | --- |
| Deployment readiness | Ready with gates | Use `docs/deployment-checklist.md`. Required migrations `0001` through `0007` must be applied before live use. |
| Environment configuration safety | Ready with gates | Public vars are limited to Supabase URL/anon key. Service role, OpenAI, Google OAuth secrets, token encryption key, and email provider key must stay server-only. |
| Owner onboarding | Ready | Onboarding status now reflects complete property details and active room setup. |
| Property setup | Ready | Requires property name, city/locality, contact phone/email, check-in/out times, and rules. |
| Rooms setup | Ready with limitation | Supports real room/unit name, max guests, base price/night, and active/inactive status. Room type is captured in the room name/helper text, not a separate DB field. |
| Public page | Ready with gates | Public page must be enabled for the pilot property and tested signed out. |
| Jonny conversation flow | Ready | Automated tests cover clear Romanian requests, vague dates, missing fields, prompt injection, repeated confirmation, stale drafts, and reset after booking creation. |
| Availability check | Ready | Availability uses backend room/bookings/block checks. Confirmed overlaps are blocked in service logic and DB constraint. |
| Pending booking creation | Ready | AI-created bookings remain pending, not confirmed. Pending booking creation is covered by tests and SQL checklist. |
| Owner notifications | Ready | Pending booking notification is created; dashboard notifications remain source of truth if email provider is absent. |
| Google Calendar status/sync | Ready with gates | Status is visible. Events are created only for confirmed bookings. Failure/reconnect state is owner-visible and token-safe. |
| Mobile usability | Ready for dry run | Layout uses responsive grids/forms. Authenticated mobile visual QA still needs a real owner session in deployed pilot. |
| Security risks | Acceptable for pilot | Cross-owner access is owner-scoped, RLS is documented/applied by migrations, service role is server-only, Google tokens are encrypted and not exposed to frontend/AI context. |
| Known limitations | Accepted for pilot | See limitations and deferred scope below. |

## Manual Dry-Run Results
Manual dry-run execution was **not completed in this local code audit** because it requires the deployed pilot environment, real owner account/session, real property/rooms, and configured environment variables.

Manual dry-run is required before sharing the public URL:
- Complete `docs/manual-smoke-test.md`.
- Complete owner rehearsal in `docs/owner-dry-run-checklist.md`.
- Run 10-20 simulated public guest conversations from `docs/public-guest-conversation-dry-run.md`.

Manual dry-run must pass:
- Owner can sign up/sign in.
- Owner can configure property and rooms without developer help.
- Public page opens signed out.
- Jonny starts and creates only pending booking requests.
- Owner sees pending booking and notification.
- Calendar status is visible.
- No cross-owner data appears.

## Known Risks
- Live behavior still depends on correct hosted env vars and applied migrations.
- `OPENAI_API_KEY` absence makes Jonny safely unavailable, which blocks public booking flow for pilot.
- Optional email provider may remain absent; dashboard notifications are the reliable pilot signal.
- Google Calendar requires OAuth vars plus `GOOGLE_TOKEN_ENCRYPTION_KEY` before calendar connection/sync testing.
- Authenticated mobile visual QA has not been completed with a real owner browser session.
- Room type is not a structured field; owners must include type in room/unit name.

## Fixes Required Before Live Owner Usage
No additional code fixes are required before a controlled pilot if all operational gates pass.

Required operational fixes/gates before live owner usage:
- Configure required env vars in the deployment target.
- Confirm server-only secrets are not exposed via `NEXT_PUBLIC_`.
- Apply migrations `0001` through `0007`.
- Configure the pilot owner account.
- Configure one real pilot property and at least one active room.
- Enable public page, chat, Jonny, and public pending booking for the pilot property.
- Keep auto-confirmation disabled.
- Run and pass manual smoke/dry-run checklists.
- Confirm owner understands pending vs confirmed.

## Explicitly Deferred
The following remain out of scope for Owner Pilot #1 and must not be added for this phase:
- WhatsApp
- SMS
- Stripe/payments
- OTA/channel manager sync
- Native apps
- Feature expansion beyond the controlled pending-booking pilot

## Final Gate
**GO** only when:
- Automated validation remains green.
- Deployment/env/migration gates pass.
- Manual dry run passes.
- Pilot owner confirms they understand and can operate pending requests.

**NO-GO** if any validation command fails, public chat cannot start, pending booking creation fails, owner cannot see pending bookings/notifications, calendar failure state is hidden, required env vars are missing, or any cross-owner exposure is observed.
