import type { BookingRecord } from "@/domain/bookings/types";

export const bookingStatusLabels: Record<BookingRecord["status"], string> = {
  pending: "În așteptare",
  confirmed: "Confirmată",
  cancelled: "Anulată",
  rejected: "Respinsă"
};
