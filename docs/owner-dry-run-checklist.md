# Owner Dry Run Checklist

## Goal
Run a guided rehearsal with the first pilot owner before live guest use.

## Before The Call
- Confirm deployed app URL.
- Confirm owner account.
- Confirm property and rooms.
- Confirm public page is enabled.
- Confirm chat and public booking are enabled.
- Confirm auto-confirmation is disabled.
- Confirm validation commands passed.
- Prepare a private/incognito browser for guest simulation.
- Prepare support note template for bugs/feedback.

## Opening Script
Sejura is in pilot mode. Jonny can help guests check availability and send booking requests, but every request remains pending until you review it. The goal today is to confirm the flow is clear, useful, and safe before broader use.

## Owner App Walkthrough
- Sign in.
- Open dashboard.
- Review property.
- Review rooms.
- Review bookings page.
- Review notifications page.
- Confirm owner understands where new requests appear.

## Guest Flow Rehearsal
Open public page signed out:
- Confirm page loads.
- Start Jonny chat.
- Send:

```text
Vreau o cazare de pe 12 06 pana pe 16 06 pentru 4 persoane.
```

- Confirm Jonny lists available rooms.
- Send:

```text
Aleg B parter. Numele meu este Mihai Popescu, telefon 0745123456.
```

- Confirm Jonny asks for explicit confirmation.
- Send:

```text
Da, confirm, trimite cererea.
```

- Confirm Jonny says the request is pending.

## Owner Follow-Up Rehearsal
- Open `/app/bookings`.
- Find the new pending booking.
- Open booking detail.
- Confirm guest details.
- Confirm owner knows available actions:
  - confirm
  - reject
  - cancel
- Open `/app/notifications`.
- Confirm pending booking notification is visible if notifications are enabled.

## Comprehension Checks
Ask owner:
- Is it clear that Jonny did not confirm the booking?
- Is it clear where you review pending requests?
- Is it clear what happens after you confirm?
- Is anything scary, confusing, or missing for first use?
- Would you feel comfortable sharing the public URL with a real guest?

## Edge Rehearsal
- Ask Jonny for an ambiguous date like `weekendul viitor`.
- Confirm Jonny asks for exact dates.
- Try selecting a room that was not listed.
- Confirm Jonny asks for one of the available rooms.
- Start a new availability request after a draft.
- Confirm old room/contact details are not reused.
- Run the expanded public guest matrix in `docs/public-guest-conversation-dry-run.md`.

## Dry Run Pass Criteria
- Owner can sign in.
- Owner can find property/rooms/bookings.
- Public page loads.
- Jonny creates a pending request.
- Owner can find the pending request.
- Owner understands pending vs confirmed.
- No P0/P1 issue is found.

## Dry Run No-Go Criteria
- Owner cannot sign in.
- Public page is inaccessible.
- Jonny cannot start.
- Pending booking is not created.
- Jonny creates confirmed booking.
- Owner cannot find booking.
- Owner sees another owner's data.

## Notes To Capture
- Owner questions.
- Confusing labels or wording.
- Incorrect room/price/capacity data.
- Jonny misunderstandings.
- Any workaround needed.
- Owner go/no-go decision for live pilot.
