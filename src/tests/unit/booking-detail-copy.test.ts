import { describe, expect, it } from "vitest";
import {
  bookingHistoryDetails,
  calendarStatusCopy,
  formatRomanianDateTime,
  shouldShowCalendarWarning
} from "@/domain/bookings/detail-copy";
import type { BookingEventRecord, BookingRecord } from "@/domain/bookings/types";

function booking(patch: Partial<BookingRecord> = {}): BookingRecord {
  return {
    id: "booking-1",
    owner_id: "owner-1",
    property_id: "property-1",
    room_id: "room-1",
    guest_name: "test proprietar",
    guest_phone: "0700000000",
    guest_email: null,
    guest_notes: null,
    start_date: "2026-12-03",
    end_date: "2026-12-15",
    guests_count: 2,
    price_per_night: 200,
    nights_count: 12,
    total_estimated_price: 2400,
    currency: "RON",
    status: "confirmed",
    source: "manual_owner",
    conversation_id: null,
    calendar_sync_status: "not_required",
    google_calendar_event_id: null,
    calendar_sync_error_code: null,
    calendar_sync_error_message: null,
    calendar_synced_at: null,
    confirmed_at: "2026-07-05T10:31:00.000Z",
    cancelled_at: null,
    rejected_at: null,
    created_by_actor_type: "owner",
    created_by_owner_id: "owner-1",
    created_at: "2026-07-05T10:30:00.000Z",
    updated_at: "2026-07-05T10:31:00.000Z",
    deleted_at: null,
    ...patch
  };
}

function event(patch: Partial<BookingEventRecord> = {}): BookingEventRecord {
  return {
    id: "event-1",
    owner_id: "owner-1",
    property_id: "property-1",
    booking_id: "booking-1",
    event_type: "booking_confirmed",
    actor_type: "owner",
    actor_owner_id: "owner-1",
    previous_status: "pending",
    new_status: "confirmed",
    metadata: {},
    created_at: "2026-07-05T10:31:00.000Z",
    ...patch
  };
}

describe("booking detail owner copy", () => {
  it("formats event timestamps in readable Romanian copy", () => {
    const formatted = formatRomanianDateTime("2026-07-05T10:31:00.000Z");

    expect(formatted).toContain("5 iulie 2026");
    expect(formatted).not.toContain("2026-07-05T10:31:00.000Z");
  });

  it("builds useful booking history details with guest and contact data", () => {
    const details = bookingHistoryDetails(booking(), event());

    expect(details).toMatchObject({
      actionLabel: "Rezervare confirmată",
      guestName: "test proprietar",
      stayPeriod: "3 decembrie 2026 – 15 decembrie 2026",
      guestsCount: 2,
      phone: "0700000000",
      email: "nesetat",
      statusLabel: "Confirmată"
    });
    expect(details.occurredAt).not.toContain("2026-07-05T10:31:00.000Z");
  });

  it("shows disconnected calendar copy without failed wording when sync is not required", () => {
    expect(
      calendarStatusCopy(
        booking({
          status: "pending",
          calendar_sync_status: "not_required"
        })
      )
    ).toEqual({
      label: "Google Calendar neconectat",
      message:
        "Rezervarea poate fi confirmată în Sejura. Google Calendar nu este conectat încă."
    });

    const confirmedDisconnected = booking({
      status: "confirmed",
      calendar_sync_status: "failed",
      calendar_sync_error_code: "GOOGLE_CALENDAR_DISCONNECTED"
    });

    expect(calendarStatusCopy(confirmedDisconnected)).toEqual({
      label: "Confirmată în Sejura",
      message:
        "Rezervarea este confirmată intern. Google Calendar nu este conectat."
    });
    expect(calendarStatusCopy(confirmedDisconnected).label).not.toContain(
      "Sincronizare eșuată"
    );
    expect(shouldShowCalendarWarning(confirmedDisconnected)).toBe(false);
  });

  it("keeps failed sync wording for real non-disconnected sync failures", () => {
    const copy = calendarStatusCopy(
      booking({
        calendar_sync_status: "failed",
        calendar_sync_error_code: "GOOGLE_EVENT_CREATE_FAILED"
      })
    );

    expect(copy.label).toBe("Sincronizare eșuată");
  });
});
