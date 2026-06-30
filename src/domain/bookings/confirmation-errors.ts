import { BookingDomainError } from "@/domain/bookings/errors";

export type ConfirmationErrorKey =
  | "confirmation-conflict"
  | "confirmation-validation"
  | "calendar-required"
  | "calendar-sync";

export function confirmationErrorKey(error: unknown): ConfirmationErrorKey {
  if (!(error instanceof BookingDomainError)) {
    return "confirmation-validation";
  }

  if (error.code === "VALIDATION" || error.code === "INVALID_STATUS_TRANSITION") {
    return "confirmation-validation";
  }

  if (error.code === "NOT_AVAILABLE") {
    const message = error.message.toLowerCase();
    if (message.includes("google calendar este obligatoriu")) {
      return "calendar-required";
    }
    if (
      message.includes("rezervare confirmata") ||
      message.includes("ocupat") ||
      message.includes("interval")
    ) {
      return "confirmation-conflict";
    }
    return "calendar-sync";
  }

  return "confirmation-validation";
}
