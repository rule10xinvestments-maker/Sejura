import Link from "next/link";
import React from "react";
import {
  buildRoomOccupancyCalendar,
  type OccupancyCell
} from "@/domain/bookings/occupancy-calendar";
import {
  formatRomanianBookingDateTime,
  roomOccupancyBookingCopy,
  roomBlockCopy
} from "@/domain/bookings/room-occupancy-summary";
import { formatRomanianStayPeriod } from "@/domain/bookings/detail-copy";
import { bookingStatusLabels } from "@/domain/bookings/status-labels";
import type { BookingRecord, RoomBlockRecord } from "@/domain/bookings/types";
import type { Room } from "@/domain/rooms/types";

type InternalRoomCalendarProps = {
  rooms: Room[];
  bookings: BookingRecord[];
  roomBlocks: RoomBlockRecord[];
  startDate: string;
  daysCount: number;
  checkInTime?: string | null;
  checkOutTime?: string | null;
};

const dayFormatter = new Intl.DateTimeFormat("ro-RO", {
  day: "numeric",
  month: "short",
  timeZone: "Europe/Bucharest",
  weekday: "short"
});

function formatDayLabel(date: string) {
  return dayFormatter.format(new Date(`${date}T00:00:00.000+03:00`));
}

function cellClass(cell: OccupancyCell) {
  if (cell.status === "occupied") {
    return "border-emerald-200 bg-emerald-50 text-emerald-900";
  }

  if (cell.status === "blocked") {
    return "border-stone-300 bg-stone-100 text-stone-800";
  }

  return "border-line bg-white text-ink/60";
}

function cellLabel(cell: OccupancyCell) {
  if (cell.status === "occupied") return "Ocupată";
  if (cell.status === "blocked") return "Indisponibilă";
  return "Liberă";
}

function pendingRequests(bookings: BookingRecord[], rooms: Room[]) {
  const roomIds = new Set(rooms.map((room) => room.id));
  const ownerIds = new Set(rooms.map((room) => room.owner_id));

  return bookings
    .filter(
      (booking) =>
        booking.status === "pending" &&
        !booking.deleted_at &&
        roomIds.has(booking.room_id) &&
        ownerIds.has(booking.owner_id)
    )
    .sort((a, b) => {
      const startComparison = a.start_date.localeCompare(b.start_date);
      if (startComparison !== 0) return startComparison;
      return a.end_date.localeCompare(b.end_date);
    });
}

export function InternalRoomCalendar({
  rooms,
  bookings,
  roomBlocks,
  startDate,
  daysCount,
  checkInTime,
  checkOutTime
}: InternalRoomCalendarProps) {
  const activeRooms = rooms.filter((room) => room.status === "active");
  const calendar = buildRoomOccupancyCalendar({
    rooms: activeRooms,
    bookings,
    roomBlocks,
    startDate,
    daysCount
  });
  const roomNames = new Map(activeRooms.map((room) => [room.id, room.name]));
  const pending = pendingRequests(bookings, activeRooms);

  return (
    <div className="space-y-5">
      <section className="panel">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-clay">Calendar intern</p>
            <h2 className="text-lg font-semibold">Ocupare pe camere</h2>
            <p className="text-sm text-ink/65">Următoarele 30 de zile</p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs font-semibold">
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-emerald-900">
              Ocupată
            </span>
            <span className="rounded-full border border-stone-300 bg-stone-100 px-3 py-1 text-stone-800">
              Indisponibilă
            </span>
            <span className="rounded-full border border-line bg-white px-3 py-1 text-ink/65">
              Liberă
            </span>
          </div>
        </div>

        {activeRooms.length === 0 ? (
          <p className="mt-4 text-sm text-ink/70">
            Adaugă o cameră ca să vezi calendarul de ocupare.
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto pb-2">
            <table className="min-w-full border-separate border-spacing-0 text-left text-xs">
              <thead>
                <tr>
                  <th className="sticky left-0 z-10 min-w-36 border-b border-line bg-white p-2 text-sm font-semibold">
                    Camera
                  </th>
                  {calendar.dates.map((date) => (
                    <th
                      className="min-w-32 border-b border-line p-2 font-semibold text-ink/70"
                      key={date}
                    >
                      {formatDayLabel(date)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {calendar.rows.map((row) => (
                  <tr key={row.room.id}>
                    <th
                      className="sticky left-0 z-10 border-b border-line bg-white p-2 text-sm font-semibold"
                      scope="row"
                    >
                      {row.room.name}
                    </th>
                    {row.cells.map((cell) => {
                      const bookingCopy = cell.booking
                        ? roomOccupancyBookingCopy(
                            cell.booking,
                            checkInTime,
                            checkOutTime
                          )
                        : null;
                      const blockCopy = cell.block ? roomBlockCopy(cell.block) : null;
                      const content = (
                        <div
                          className={`min-h-24 rounded-md border p-2 ${cellClass(cell)}`}
                        >
                          <p className="font-semibold">{cellLabel(cell)}</p>
                          {bookingCopy && cell.booking ? (
                            <>
                              <p className="mt-1 truncate font-medium">
                                {bookingCopy.guestName}
                              </p>
                              <p className="truncate">
                                {formatRomanianStayPeriod(
                                  cell.booking.start_date,
                                  cell.booking.end_date
                                )}
                              </p>
                              <p className="truncate">
                                Se eliberează: {bookingCopy.checkout}
                              </p>
                              <p className="mt-1 font-semibold">Vezi rezervarea</p>
                            </>
                          ) : null}
                          {blockCopy ? (
                            <>
                              <p className="mt-1 truncate">{blockCopy.reason}</p>
                              <p className="truncate">{blockCopy.period}</p>
                            </>
                          ) : null}
                        </div>
                      );

                      return (
                        <td className="border-b border-line p-1 align-top" key={cell.date}>
                          {cell.booking ? (
                            <Link
                              aria-label={`Vezi rezervarea ${cell.booking.guest_name}`}
                              href={`/app/bookings/${cell.booking.id}`}
                            >
                              {content}
                            </Link>
                          ) : (
                            content
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="grid gap-3">
        <div>
          <h2 className="text-lg font-semibold">Cereri în așteptare</h2>
          <p className="text-sm text-ink/65">
            Nu blochează camera până la confirmare.
          </p>
        </div>
        {pending.length === 0 ? (
          <p className="panel text-sm text-ink/70">
            Nu există cereri în așteptare pentru perioada curentă.
          </p>
        ) : (
          pending.map((booking) => (
            <Link
              className="panel block"
              href={`/app/bookings/${booking.id}`}
              key={booking.id}
            >
              <p className="font-semibold">{booking.guest_name}</p>
              <p className="text-sm text-ink/65">
                {roomNames.get(booking.room_id) ?? "Camera"} ·{" "}
                {formatRomanianStayPeriod(booking.start_date, booking.end_date)}
              </p>
              <p className="text-sm text-ink/65">
                Oaspeți: {booking.guests_count}
              </p>
              {booking.guest_phone ? (
                <p className="text-sm text-ink/65">Telefon: {booking.guest_phone}</p>
              ) : null}
              <p className="text-sm text-ink/65">
                Status: {bookingStatusLabels[booking.status]}
              </p>
              <p className="mt-2 text-sm font-semibold text-moss">Vezi rezervarea</p>
            </Link>
          ))
        )}
      </section>

      <section className="grid gap-3">
        <h2 className="text-lg font-semibold">Rezervări confirmate</h2>
        {bookings.filter((booking) => booking.status === "confirmed").length === 0 ? (
          <p className="panel text-sm text-ink/70">
            Nu există rezervări confirmate.
          </p>
        ) : (
          bookings
            .filter((booking) => booking.status === "confirmed")
            .map((booking) => (
              <Link
                className="panel block"
                href={`/app/bookings/${booking.id}`}
                key={booking.id}
              >
                <p className="font-semibold">{booking.guest_name}</p>
                <p className="text-sm text-ink/65">
                  {roomNames.get(booking.room_id) ?? "Camera"} ·{" "}
                  {formatRomanianStayPeriod(booking.start_date, booking.end_date)}
                </p>
                <p className="text-sm text-ink/65">
                  Se eliberează:{" "}
                  {formatRomanianBookingDateTime(booking.end_date, checkOutTime)}
                </p>
              </Link>
            ))
        )}
      </section>
    </div>
  );
}
