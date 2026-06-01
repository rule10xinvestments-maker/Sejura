import type { CalendarSyncStatus } from "@/domain/bookings/types";
import type { GoogleCalendarErrorCode } from "@/domain/google-calendar/errors";

export type CalendarSyncResult = {
  eventId: string | null;
  status: CalendarSyncStatus;
  syncedAt: string | null;
  errorCode: GoogleCalendarErrorCode | null;
  errorMessage: string | null;
};

export type BookingCalendarSyncPort = {
  syncConfirmedBooking(ownerId: string, bookingId: string): Promise<CalendarSyncResult>;
  markCancelledBooking(ownerId: string, bookingId: string): Promise<CalendarSyncResult>;
};
