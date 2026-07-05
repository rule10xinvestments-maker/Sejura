import { bookingEventStatusLabels, formatRomanianStayPeriod } from "@/domain/bookings/detail-copy";
import type { BookingRecord, RoomBlockRecord } from "@/domain/bookings/types";
import type { Room } from "@/domain/rooms/types";

const roDateTimeFormatter = new Intl.DateTimeFormat("ro-RO", {
  day: "numeric",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Bucharest"
});

export type RoomOccupancySummary = {
  roomId: string;
  status: "occupied" | "blocked" | "free-now" | "free";
  statusLabel: string;
  currentBooking: BookingRecord | null;
  nextBooking: BookingRecord | null;
  pendingBookings: BookingRecord[];
  currentBlock: RoomBlockRecord | null;
  nextBlock: RoomBlockRecord | null;
};

type BuildRoomOccupancySummariesInput = {
  rooms: Room[];
  bookings: BookingRecord[];
  roomBlocks?: RoomBlockRecord[];
  today: string;
  checkInTime?: string | null;
  checkOutTime?: string | null;
};

function overlapsDate(date: string, startDate: string, endDate: string) {
  return startDate <= date && date < endDate;
}

function startsTodayOrLater(today: string, startDate: string) {
  return startDate >= today;
}

function byStartDate<T extends { start_date: string; end_date: string }>(a: T, b: T) {
  const startComparison = a.start_date.localeCompare(b.start_date);
  if (startComparison !== 0) return startComparison;
  return a.end_date.localeCompare(b.end_date);
}

export function formatRomanianBookingDateTime(date: string, time?: string | null) {
  const safeTime = time && /^\d{2}:\d{2}$/.test(time) ? time : "00:00";
  const value = new Date(`${date}T${safeTime}:00.000+03:00`);
  return roDateTimeFormatter.format(value).replace(" la ", ", ");
}

export function bookingContactCopy(booking: BookingRecord) {
  return {
    phone: booking.guest_phone,
    email: booking.guest_email ?? "Email nesetat"
  };
}

export function buildRoomOccupancySummaries({
  rooms,
  bookings,
  roomBlocks = [],
  today,
  checkInTime,
  checkOutTime
}: BuildRoomOccupancySummariesInput) {
  const roomIds = new Set(rooms.map((room) => room.id));
  const ownerIds = new Set(rooms.map((room) => room.owner_id));

  const visibleBookings = bookings.filter(
    (booking) =>
      roomIds.has(booking.room_id) &&
      ownerIds.has(booking.owner_id) &&
      !booking.deleted_at
  );
  const visibleBlocks = roomBlocks.filter(
    (block) =>
      roomIds.has(block.room_id) &&
      ownerIds.has(block.owner_id) &&
      !block.deleted_at
  );

  return rooms.map<RoomOccupancySummary>((room) => {
    const roomBookings = visibleBookings.filter((booking) => booking.room_id === room.id);
    const confirmed = roomBookings
      .filter((booking) => booking.status === "confirmed")
      .sort(byStartDate);
    const pendingBookings = roomBookings
      .filter((booking) => booking.status === "pending")
      .sort(byStartDate);
    const blocks = visibleBlocks
      .filter((block) => block.room_id === room.id)
      .sort(byStartDate);

    const currentBooking =
      confirmed.find((booking) =>
        overlapsDate(today, booking.start_date, booking.end_date)
      ) ?? null;
    const nextBooking =
      confirmed.find((booking) => startsTodayOrLater(today, booking.start_date)) ??
      null;
    const currentBlock =
      blocks.find((block) => overlapsDate(today, block.start_date, block.end_date)) ??
      null;
    const nextBlock =
      blocks.find((block) => startsTodayOrLater(today, block.start_date)) ?? null;

    if (currentBooking) {
      return {
        roomId: room.id,
        status: "occupied",
        statusLabel: "Ocupată acum",
        currentBooking,
        nextBooking,
        pendingBookings,
        currentBlock,
        nextBlock
      };
    }

    if (currentBlock) {
      return {
        roomId: room.id,
        status: "blocked",
        statusLabel: "Blocată acum",
        currentBooking: null,
        nextBooking,
        pendingBookings,
        currentBlock,
        nextBlock
      };
    }

    if (nextBooking) {
      return {
        roomId: room.id,
        status: "free-now",
        statusLabel: "Liberă acum",
        currentBooking: null,
        nextBooking,
        pendingBookings,
        currentBlock: null,
        nextBlock
      };
    }

    return {
      roomId: room.id,
      status: "free",
      statusLabel: "Liberă",
      currentBooking: null,
      nextBooking: null,
      pendingBookings,
      currentBlock: null,
      nextBlock
    };
  });
}

export function roomOccupancyBookingCopy(
  booking: BookingRecord,
  checkInTime?: string | null,
  checkOutTime?: string | null
) {
  return {
    guestName: booking.guest_name,
    stayPeriod: formatRomanianStayPeriod(booking.start_date, booking.end_date),
    checkIn: formatRomanianBookingDateTime(booking.start_date, checkInTime),
    checkout: formatRomanianBookingDateTime(booking.end_date, checkOutTime),
    guestsCount: booking.guests_count,
    statusLabel: bookingEventStatusLabels[booking.status],
    ...bookingContactCopy(booking)
  };
}

export function roomBlockCopy(block: RoomBlockRecord) {
  return {
    period: formatRomanianStayPeriod(block.start_date, block.end_date),
    reason: block.reason ?? "Indisponibilă"
  };
}
