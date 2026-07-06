import type { BookingEventRecord, BookingRecord } from "@/domain/bookings/types";

const roDateFormatter = new Intl.DateTimeFormat("ro-RO", {
  day: "numeric",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Bucharest"
});

const roDayFormatter = new Intl.DateTimeFormat("ro-RO", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC"
});

export const bookingEventLabels: Record<string, string> = {
  booking_created: "Rezervare creată",
  booking_confirmed: "Rezervare confirmată",
  booking_rejected: "Rezervare respinsă",
  booking_cancelled: "Rezervare anulată"
};

export const bookingEventStatusLabels: Record<BookingRecord["status"], string> = {
  pending: "În așteptare",
  confirmed: "Confirmată",
  cancelled: "Anulată",
  rejected: "Respinsă"
};

type CalendarCopyOptions = {
  calendarRequiredForConfirmation?: boolean;
};

type CalendarStatusCopy = {
  label: string;
  message?: string;
};

const internalCalendarCopy = {
  label: "Calendar Sejura activ",
  message:
    "Rezervările sunt gestionate în calendarul intern Sejura. Google Calendar poate fi conectat ulterior din setări."
};

export function formatRomanianDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return roDateFormatter.format(date).replace(" la ", ", ");
}

function parseCalendarDate(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}

export function formatRomanianStayPeriod(startDate: string, endDate: string) {
  return `${roDayFormatter.format(parseCalendarDate(startDate))} – ${roDayFormatter.format(
    parseCalendarDate(endDate)
  )}`;
}

function isOptionalDisconnectedCalendar(
  booking: BookingRecord,
  options: CalendarCopyOptions
) {
  if (options.calendarRequiredForConfirmation) return false;

  return (
    booking.calendar_sync_status === "not_required" ||
    ((booking.calendar_sync_status === "failed" ||
      booking.calendar_sync_status === "needs_reconnect") &&
      (booking.calendar_sync_error_code === "GOOGLE_CALENDAR_DISCONNECTED" ||
        booking.calendar_sync_error_code === "GOOGLE_RECONNECT_REQUIRED"))
  );
}

export function calendarStatusCopy(
  booking: BookingRecord,
  options: CalendarCopyOptions = {}
): CalendarStatusCopy {
  if (isOptionalDisconnectedCalendar(booking, options)) {
    return internalCalendarCopy;
  }

  const syncLabels: Record<BookingRecord["calendar_sync_status"], string> = {
    not_required: "Nu este necesar",
    pending: "În așteptare",
    synced: "Sincronizat",
    failed: "Sincronizare eșuată",
    needs_reconnect: "Necesită reconectare"
  };

  return { label: syncLabels[booking.calendar_sync_status] };
}

export function shouldShowCalendarWarning(
  booking: BookingRecord,
  options: CalendarCopyOptions = {}
) {
  if (isOptionalDisconnectedCalendar(booking, options)) {
    return false;
  }

  return (
    booking.calendar_sync_status === "failed" ||
    booking.calendar_sync_status === "needs_reconnect"
  );
}

export function bookingHistoryDetails(
  booking: BookingRecord,
  event: BookingEventRecord
) {
  const resultingStatus = event.new_status ?? booking.status;

  return {
    actionLabel: bookingEventLabels[event.event_type] ?? event.event_type,
    occurredAt: formatRomanianDateTime(event.created_at),
    guestName: booking.guest_name,
    stayPeriod: formatRomanianStayPeriod(booking.start_date, booking.end_date),
    guestsCount: booking.guests_count,
    phone: booking.guest_phone,
    email: booking.guest_email ?? "nesetat",
    statusLabel: bookingEventStatusLabels[resultingStatus]
  };
}
