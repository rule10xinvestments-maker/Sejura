# Pilot Execution Plan - Owner Pilot #1

## Goal
Prepare and run Sejura's first live owner pilot using the current MVP: public property page, Jonny chat, availability checks, pending booking requests, owner dashboard, and notifications.

This is operational launch preparation only. Do not add features, Stripe, WhatsApp/SMS, OTA, billing, mobile apps, or scope expansion during this pilot.

## Pilot Scope
- One owner.
- One property.
- Public booking in pending-only mode.
- Jonny creates pending booking requests only.
- Owner confirms, rejects, or cancels requests manually.
- Dashboard notifications are the primary operational signal.
- Email alerts are optional and not required for pilot success.

## Roles
- Pilot owner: validates day-to-day usefulness, reviews pending booking requests, gives feedback.
- Sejura operator: prepares environment, runs smoke tests, monitors pilot, captures bugs and feedback.
- Technical support: investigates issues using conversations, `ai_tool_calls`, bookings, and logs.

## Production Deployment Checklist
- Confirm deployment target and `APP_BASE_URL`.
- Confirm required environment variables are configured.
- Confirm migrations `0001` through `0007` are applied.
- Confirm owner account exists and can sign in.
- Confirm pilot property and rooms are configured.
- Confirm public page, chat, AI booking, and public booking are enabled.
- Confirm auto-confirmation is disabled.
- Run validation commands:
  - `pnpm.cmd lint`
  - `pnpm.cmd typecheck`
  - `pnpm.cmd test`
  - `pnpm.cmd build`
- Run manual smoke test from `docs/manual-smoke-test.md`.
- Share public URL only after smoke passes.

## Pilot Property Setup Checklist
- Property name is correct.
- Slug/public URL is correct.
- City is correct.
- Public description is acceptable for guests.
- Public contact details are correct or intentionally blank.
- Check-in/check-out times are correct.
- Public page is enabled.
- Chat is enabled.
- AI booking is enabled.
- Public booking is enabled.
- Auto-confirmation is disabled.
- Rooms are active with correct:
  - names
  - capacity
  - price per night
  - status
- Any known unavailable periods are represented as confirmed bookings or room blocks.

## Owner Onboarding Dry Run
1. Explain pilot scope: Jonny creates pending requests, not confirmed bookings.
2. Sign in as the owner.
3. Open `/app`.
4. Review dashboard.
5. Open `/app/property`.
6. Review public property details.
7. Open `/app/rooms`.
8. Review room names, capacities, and prices.
9. Open public page in a signed-out/private browser.
10. Run one sample guest conversation.
11. Confirm pending booking appears in `/app/bookings`.
12. Open `/app/notifications`.
13. Explain how to confirm, reject, or cancel.
14. Agree on support channel and feedback cadence.

## Manual Launch Procedure
1. Freeze scope for launch day.
2. Confirm latest validation passed.
3. Confirm deployment and env.
4. Confirm migrations.
5. Run owner app smoke.
6. Run public guest smoke.
7. Run SQL verification for tool calls and booking source/status.
8. Review known limitations with owner.
9. Share public URL with owner.
10. Monitor first live guest/session.
11. Capture feedback and bugs using the reporting flow below.

## Rollback Steps
Fast rollback:
- Disable public page or chat for the pilot property.
- Or disable AI booking/public booking in property settings.
- Keep owner app available so existing pending bookings can be reviewed.
- Preserve all conversations, messages, tool calls, notifications, and bookings.

Build rollback:
- Redeploy previous known-good build.
- Keep migrations applied unless a migration is proven to be the blocker.

Database rollback:
- Avoid destructive rollback during active pilot use.
- Export affected rows before changes.
- Document owner/property/conversation/booking IDs involved.
- Prefer forward fix or temporary feature disablement over deleting data.

## Bug Reporting Flow
For every bug, capture:
- Date/time and timezone.
- Owner/property.
- Public URL.
- Browser/device.
- Exact guest message text.
- Conversation ID if available.
- Booking ID if created.
- Screenshot or screen recording if useful.
- Expected behavior.
- Actual behavior.
- Severity:
  - P0: data leak, security issue, owner cannot access app, confirmed booking created incorrectly.
  - P1: pending booking cannot be created or owner cannot act on booking.
  - P2: confusing Jonny response, incorrect wording, recoverable validation issue.
  - P3: cosmetic issue or non-blocking polish.

## Feedback Capture Flow
Ask the owner after each meaningful use:
- Did Jonny understand the guest request?
- Was pending/not-confirmed status clear?
- Was it easy to find the booking?
- Was it clear what action to take next?
- Did notifications help?
- What felt risky or confusing?
- Would you use this with another real guest?

## Pilot Success Metrics
See `docs/pilot-metrics.md` for detailed KPIs. Minimum success for Owner Pilot #1:
- Owner completes onboarding dry run.
- Public smoke creates a pending booking.
- Owner sees and acts on that booking.
- No cross-tenant/security issue appears.
- No AI-created confirmed booking occurs.
- Owner can identify at least one real workflow where Sejura saves time.

## Validation Results
- `pnpm.cmd lint`: passed.
- `pnpm.cmd typecheck`: passed.
- `pnpm.cmd test`: passed, 16 files / 78 tests.
- `pnpm.cmd build`: passed.
