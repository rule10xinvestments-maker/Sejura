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

export function calendarStatusCopy(booking: BookingRecord) {
  if (booking.calendar_sync_status === "not_required") {
    if (booking.status === "pending") {
      return {
        label: "Google Calendar neconectat",
        message:
          "Rezervarea poate fi confirmată în Sejura. Google Calendar nu este conectat încă."
      };
    }

    if (booking.status === "confirmed") {
      return {
        label: "Confirmată în Sejura",
        message:
          "Rezervarea este confirmată intern. Google Calendar nu este conectat."
      };
    }
  }

  if (
    booking.status === "confirmed" &&
    booking.calendar_sync_status === "failed" &&
    booking.calendar_sync_error_code === "GOOGLE_CALENDAR_DISCONNECTED"
  ) {
    return {
      label: "Confirmată în Sejura",
      message:
        "Rezervarea este confirmată intern. Google Calendar nu este conectat."
    };
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

export function shouldShowCalendarWarning(booking: BookingRecord) {
  if (
    booking.status === "confirmed" &&
    booking.calendar_sync_status === "failed" &&
    booking.calendar_sync_error_code === "GOOGLE_CALENDAR_DISCONNECTED"
  ) {
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
