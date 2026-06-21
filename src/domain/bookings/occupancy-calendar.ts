import type { Room } from "@/domain/rooms/types";
import type { BookingRecord, RoomBlockRecord } from "@/domain/bookings/types";

export type OccupancyCellStatus = "free" | "occupied" | "pending" | "blocked";

export type OccupancyCell = {
  date: string;
  status: OccupancyCellStatus;
  label: string;
  booking: BookingRecord | null;
  block: RoomBlockRecord | null;
};

export type RoomOccupancyRow = {
  room: Room;
  cells: OccupancyCell[];
};

function toDateOnly(date: Date) {
  return date.toISOString().slice(0, 10);
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

export function dateRange(startDate: string, daysCount: number) {
  const start = new Date(`${startDate}T00:00:00.000Z`);
  return Array.from({ length: daysCount }, (_, index) =>
    toDateOnly(addDays(start, index))
  );
}

function overlapsNight(date: string, startDate: string, endDate: string) {
  return startDate <= date && date < endDate;
}

export function buildRoomOccupancyCalendar(input: {
  rooms: Room[];
  bookings: BookingRecord[];
  roomBlocks: RoomBlockRecord[];
  startDate: string;
  daysCount: number;
}) {
  const dates = dateRange(input.startDate, input.daysCount);
  const roomIds = new Set(input.rooms.map((room) => room.id));
  const activeBookings = input.bookings.filter(
    (booking) =>
      roomIds.has(booking.room_id) &&
      !booking.deleted_at &&
      (booking.status === "confirmed" || booking.status === "pending")
  );
  const activeBlocks = input.roomBlocks.filter(
    (block) => roomIds.has(block.room_id) && !block.deleted_at
  );

  const rows: RoomOccupancyRow[] = input.rooms.map((room) => ({
    room,
    cells: dates.map((date) => {
      const block =
        activeBlocks.find(
          (candidate) =>
            candidate.room_id === room.id &&
            overlapsNight(date, candidate.start_date, candidate.end_date)
        ) ?? null;
      if (block) {
        return {
          date,
          status: "blocked",
          label: "Blocat",
          booking: null,
          block
        };
      }

      const confirmed =
        activeBookings.find(
          (booking) =>
            booking.room_id === room.id &&
            booking.status === "confirmed" &&
            overlapsNight(date, booking.start_date, booking.end_date)
        ) ?? null;
      if (confirmed) {
        return {
          date,
          status: "occupied",
          label: "Ocupat",
          booking: confirmed,
          block: null
        };
      }

      const pending =
        activeBookings.find(
          (booking) =>
            booking.room_id === room.id &&
            booking.status === "pending" &&
            overlapsNight(date, booking.start_date, booking.end_date)
        ) ?? null;
      if (pending) {
        return {
          date,
          status: "pending",
          label: "In asteptare",
          booking: pending,
          block: null
        };
      }

      return {
        date,
        status: "free",
        label: "Liber",
        booking: null,
        block: null
      };
    })
  }));

  return { dates, rows };
}

