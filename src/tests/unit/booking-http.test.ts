import { describe, expect, it } from "vitest";
import { BookingDomainError } from "@/domain/bookings/errors";
import { jsonError } from "@/domain/bookings/http";

describe("booking API errors", () => {
  it("returns a specific code and copy for same-room confirmation conflicts", async () => {
    const response = jsonError(
      new BookingDomainError(
        "NOT_AVAILABLE",
        "Camera nu mai este disponibilă pentru perioada aleasă."
      )
    );

    await expect(response.json()).resolves.toEqual({
      code: "ROOM_NOT_AVAILABLE",
      error: "Camera nu mai este disponibilă pentru perioada aleasă."
    });
    expect(response.status).toBe(409);
  });

  it("returns owner-safe conflict details when the blocking booking is known", async () => {
    const response = jsonError(
      new BookingDomainError(
        "NOT_AVAILABLE",
        "Camera nu mai este disponibilă pentru perioada aleasă.",
        {
          conflict: {
            id: "booking-confirmed",
            guest_name: "Ana Pop",
            guest_phone: "0700000000",
            start_date: "2026-09-10",
            end_date: "2026-09-12"
          }
        }
      )
    );

    await expect(response.json()).resolves.toEqual({
      code: "ROOM_NOT_AVAILABLE",
      error: "Camera nu mai este disponibilă pentru perioada aleasă.",
      conflict: {
        bookingId: "booking-confirmed",
        guestName: "Ana Pop",
        guestPhone: "0700000000",
        startDate: "2026-09-10",
        endDate: "2026-09-12"
      }
    });
  });

  it("returns a specific code and copy when Google Calendar is required", async () => {
    const response = jsonError(
      new BookingDomainError(
        "NOT_AVAILABLE",
        "Rezervarea nu poate fi confirmata deoarece Google Calendar este obligatoriu pentru aceasta pensiune. Conecteaza calendarul sau dezactiveaza cerinta din setari."
      )
    );

    await expect(response.json()).resolves.toEqual({
      code: "GOOGLE_CALENDAR_REQUIRED",
      error: "Google Calendar trebuie conectat înainte de confirmare."
    });
    expect(response.status).toBe(409);
  });
});
