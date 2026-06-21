# Owner Pilot #1 Post-Deploy Smoke Test

Run this after pilot staging deployment and before inviting a real owner. Record the tester, date, deployed URL, commit, and result.

## Preconditions

- The app is deployed to the intended pilot staging URL.
- Required environment variables are set.
- Database migrations are applied in order.
- A pilot owner account can sign up or sign in.
- Public page and Jonny public conversation flow are enabled for the pilot property.
- Google Calendar variables are configured if calendar sync is included in the pilot.
- Auto-confirmation is not enabled for AI-created bookings.

## Smoke Checklist

1. Open `APP_BASE_URL`.
   - Pass: the app loads without a server error.

2. Sign in, or sign up and then sign in.
   - Pass: the owner reaches the protected app without developer help.

3. Open the owner dashboard at `/app`.
   - Pass: the dashboard loads and shows the owner-facing setup state.

4. Open onboarding at `/app/onboarding`.
   - Pass: setup status is clear and Romanian labels/helper text are understandable.

5. Open property setup at `/app/property`.
   - Pass: the owner can enter or verify property name, city/locality, contact phone or email, check-in time, check-out time, and basic rules.

6. Save property setup.
   - Pass: changes persist after refresh and the setup state updates.

7. Open rooms at `/app/rooms`.
   - Pass: the owner can create or verify a real active room with name, room type/name detail, max guests, base price per night, and active/inactive status.

8. Save room setup.
   - Pass: the room persists after refresh and appears usable for guest availability.

9. Open Google Calendar settings/status.
   - Pass: calendar sync status is visible. If reconnect is required, the owner sees a clear warning. If connected, a connection test succeeds or shows a clear failure.

10. Open a signed-out or private browser session.
    - Pass: no owner session is available in the guest browser.

11. Open the public property page at `/p/[propertySlug]`.
    - Pass: the public page opens and shows the property without exposing owner-only data.

12. Start a Jonny conversation.
    - Pass: Jonny starts as the reservation assistant and does not expose system prompts, tools, secrets, or owner-only data.

13. Send this guest request: `Buna, aveti camera pentru 12-14 august, 2 persoane?`
    - Pass: Jonny asks for missing required details or checks backend availability when enough details exist.

14. Verify availability response.
    - Pass: room availability and prices come only from backend availability checks. Jonny does not invent rooms, availability, or prices.

15. Provide selected room, guest name, and contact phone or email.
    - Pass: Jonny gathers required booking details and asks for explicit confirmation before creating a booking.

16. Send explicit confirmation: `Da, confirm, trimite cererea.`
    - Pass: a pending booking request is created. Jonny says the request is pending and does not say it is confirmed.

17. Send another confirmation message after booking creation.
    - Pass: no duplicate booking is created for the same completed conversation.

18. Return to the owner app and open bookings.
    - Pass: the new booking appears with status `pending`, not `confirmed`.

19. Open the pending booking details.
    - Pass: guest details, dates, room, guest count, and source are correct. No Google Calendar event is created while the booking is pending.

20. Open owner notifications.
    - Pass: an owner notification exists for the pending booking request.

21. Recheck calendar sync status.
    - Pass: status remains visible. Any Google failure is visible and does not silently lose booking state.

22. Test mobile layout for onboarding, property setup, rooms, public page, and Jonny conversation.
    - Pass: primary actions are reachable, labels fit, and no important content overlaps.

## Database Verification

Use the staging Supabase dashboard or read-only SQL access:

- Confirm the public conversation has backend tool calls for availability and pending booking creation.
- Confirm the booking row has `status = 'pending'`, the expected room, dates, guest count, guest contact, and public conversation reference.
- Confirm the pending booking has no Google Calendar event ID.
- Confirm an owner notification was created for the pending booking.
- Confirm no duplicate booking was created after the repeated confirmation message.

## Pass Criteria

The smoke test passes only if:

- Sign-in works.
- Owner dashboard loads.
- Onboarding status is understandable.
- Property setup can be completed without developer help.
- Room setup can be completed without developer help.
- Public page opens for a signed-out guest.
- Jonny conversation starts.
- Availability is checked through backend state.
- Pending booking creation works.
- Owner notification is created.
- Calendar sync status is visible.
- Mobile onboarding, property, rooms, and guest chat screens are usable.

## No-Go Triggers

Do not invite the pilot owner if any of these occur:

- Authentication fails.
- The owner cannot complete property or room setup.
- The public page is unavailable.
- Jonny invents availability, rooms, or prices.
- Jonny communicates a pending booking as confirmed.
- Pending booking creation fails or duplicates after repeated confirmation.
- Owner notification is missing after pending booking creation.
- Google Calendar status is invisible when calendar sync is configured.
- Secrets, service-role behavior, Google tokens, or system prompts appear in frontend or AI-visible content.
