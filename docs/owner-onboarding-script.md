# Owner Onboarding Script

## Purpose
Guide the first pilot owner through Sejura without overpromising features outside the current MVP.

## Opening
Sejura is ready for a first pilot with your property. The public assistant, Jonny, can answer availability questions and create pending booking requests. You stay in control: bookings are not automatically confirmed.

## What Works Today
- Public property page.
- Jonny public chat.
- Availability checks against your rooms/bookings.
- Pending booking requests from guests.
- Owner dashboard.
- Booking list and booking detail.
- Confirm, reject, and cancel owner actions.
- Dashboard notifications.
- Optional email notification plumbing if configured.

## What Is Not Included In This Pilot
- Payments or Stripe.
- Automatic payment collection.
- OTA/channel manager sync.
- WhatsApp/SMS/phone AI.
- Native mobile apps.
- Billing or subscription management.
- Fully automated confirmed bookings from Jonny.

## Walkthrough
1. Sign in with the owner account.
2. Open the dashboard.
3. Review the property page details.
4. Review room names, capacity, and prices.
5. Open the public page URL in a signed-out browser.
6. Start a Jonny conversation.
7. Ask for availability in Romanian using exact dates and guest count.
8. Choose a room and provide name plus phone or email.
9. Confirm the pending request.
10. Return to the owner app.
11. Open bookings and find the pending request.
12. Open notifications and review the new action item.
13. Decide whether to confirm, reject, or cancel.

## Suggested Demo Guest Message
```text
Vreau o cazare de pe 12 06 pana pe 16 06 pentru 4 persoane.
```

Then:

```text
Aleg B parter. Numele meu este Mihai Popescu, telefon 0745123456.
```

Then:

```text
Da, confirm, trimite cererea.
```

## Owner Expectations
- A request from Jonny is pending, not confirmed.
- The owner should review every pending request.
- Calendar behavior applies after owner confirmation, not while the booking is pending.
- Dashboard notifications are the most reliable pilot signal.
- If email is not configured, use the app dashboard directly.

## Support Questions To Ask During Pilot
- Did the public page explain the property clearly enough?
- Did Jonny ask for the right details?
- Was it clear that the request was pending?
- Could you find the booking quickly?
- Was the owner action flow clear?
- What confused you?
- What would block you from using this with real guests?

## Closing
For the pilot, keep using Sejura for pending requests only. If something looks wrong, do not delete data; send the conversation, booking time, and guest message text through the agreed support channel.
