import { describe, expect, it } from "vitest";
import { confirmationErrorKey } from "@/domain/bookings/confirmation-errors";
import { BookingDomainError } from "@/domain/bookings/errors";

describe("confirmationErrorKey", () => {
  it("maps same-room confirmed conflicts to a specific confirmation conflict", () => {
    expect(
      confirmationErrorKey(
        new BookingDomainError(
          "NOT_AVAILABLE",
          "Exista deja o rezervare confirmata in acest interval."
        )
      )
    ).toBe("confirmation-conflict");
  });

  it("maps validation failures away from the generic unavailable booking form error", () => {
    expect(
      confirmationErrorKey(
        new BookingDomainError("VALIDATION", "Data de final trebuie verificata.")
      )
    ).toBe("confirmation-validation");
  });

  it("maps calendar sync failures separately from occupancy conflicts", () => {
    expect(
      confirmationErrorKey(
        new BookingDomainError(
          "NOT_AVAILABLE",
          "Google Calendar nu a putut fi sincronizat. Rezervarea ramane in asteptare."
        )
      )
    ).toBe("calendar-sync");
  });

  it("maps required Google Calendar policy failures to a clear key", () => {
    expect(
      confirmationErrorKey(
        new BookingDomainError(
          "NOT_AVAILABLE",
          "Rezervarea nu poate fi confirmata deoarece Google Calendar este obligatoriu pentru aceasta pensiune. Conecteaza calendarul sau dezactiveaza cerinta din setari."
        )
      )
    ).toBe("calendar-required");
  });
});
