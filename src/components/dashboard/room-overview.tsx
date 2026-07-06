import React from "react";
import Link from "next/link";
import {
  roomBlockCopy,
  roomOccupancyBookingCopy,
  type RoomOccupancySummary
} from "@/domain/bookings/room-occupancy-summary";
import type { Room } from "@/domain/rooms/types";

type RoomOverviewProps = {
  rooms: Room[];
  occupancySummaries: RoomOccupancySummary[];
  checkInTime?: string | null;
  checkOutTime?: string | null;
};

const priceFormatter = new Intl.NumberFormat("ro-RO", {
  maximumFractionDigits: 0,
  style: "currency",
  currency: "RON"
});

function roomPriceCopy(room: Room) {
  return `${priceFormatter.format(room.base_price_per_night)}/noapte`;
}

export function RoomOverview({
  rooms,
  occupancySummaries,
  checkInTime,
  checkOutTime
}: RoomOverviewProps) {
  const activeRooms = rooms.filter((room) => room.status === "active");
  const activeRoomIds = new Set(activeRooms.map((room) => room.id));
  const summaries = occupancySummaries.filter((summary) =>
    activeRoomIds.has(summary.roomId)
  );
  const roomsById = new Map(activeRooms.map((room) => [room.id, room]));
  const occupiedRooms = summaries.filter((summary) => summary.status === "occupied");
  const blockedRooms = summaries.filter((summary) => summary.status === "blocked");
  const freeRooms = summaries.filter(
    (summary) => summary.status === "free" || summary.status === "free-now"
  );
  const pendingRequests = summaries.flatMap((summary) =>
    summary.pendingBookings.map((booking) => ({ booking, roomId: summary.roomId }))
  );

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-clay">Calendar intern</p>
          <h2 className="text-xl font-bold">Imagine de ansamblu camere</h2>
        </div>
        <Link className="button-secondary min-h-10 justify-center px-3 py-2" href="/app/rooms">
          Vezi camere
        </Link>
      </div>

      <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <div className="rounded-md border border-line bg-white p-3">
          <dt className="text-xs font-semibold uppercase text-ink/55">Camere active</dt>
          <dd className="mt-1 text-2xl font-bold">{activeRooms.length}</dd>
        </div>
        <div className="rounded-md border border-line bg-white p-3">
          <dt className="text-xs font-semibold uppercase text-ink/55">Camere libere</dt>
          <dd className="mt-1 text-2xl font-bold">{freeRooms.length}</dd>
        </div>
        <div className="rounded-md border border-line bg-white p-3">
          <dt className="text-xs font-semibold uppercase text-ink/55">Camere ocupate</dt>
          <dd className="mt-1 text-2xl font-bold">{occupiedRooms.length}</dd>
        </div>
        <div className="rounded-md border border-line bg-white p-3">
          <dt className="text-xs font-semibold uppercase text-ink/55">Cereri în așteptare</dt>
          <dd className="mt-1 text-2xl font-bold">{pendingRequests.length}</dd>
        </div>
      </dl>

      {blockedRooms.length > 0 ? (
        <div className="rounded-md border border-stone-200 bg-stone-50 p-3">
          <p className="text-sm font-semibold">Camere indisponibile</p>
          <ul className="mt-3 grid gap-3">
            {blockedRooms.map((summary) => {
              const room = roomsById.get(summary.roomId);
              const copy = summary.currentBlock ? roomBlockCopy(summary.currentBlock) : null;

              return room && copy ? (
                <li className="rounded-md bg-white p-3 text-sm" key={summary.roomId}>
                  <p className="font-semibold">{room.name}</p>
                  <p>Indisponibilă acum</p>
                  <p>Perioadă: {copy.period}</p>
                  <p>Motiv: {copy.reason}</p>
                </li>
              ) : null;
            })}
          </ul>
        </div>
      ) : null}

      <div className="grid gap-3 lg:grid-cols-2">
        <div className="rounded-md border border-line bg-mist/40 p-3">
          <h3 className="font-semibold">Camere libere</h3>
          {freeRooms.length > 0 ? (
            <ul className="mt-3 grid gap-3">
              {freeRooms.map((summary) => {
                const room = roomsById.get(summary.roomId);
                if (!room) return null;
                const nextCopy = summary.nextBooking
                  ? roomOccupancyBookingCopy(
                      summary.nextBooking,
                      checkInTime,
                      checkOutTime
                    )
                  : null;

                return (
                  <li className="rounded-md border border-line bg-white p-3 text-sm" key={room.id}>
                    <div className="flex flex-col gap-1">
                      <p className="font-semibold">{room.name}</p>
                      <p>{room.max_guests} oaspeți · {roomPriceCopy(room)}</p>
                      <p className="w-fit rounded-md bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-800">
                        Liberă acum
                      </p>
                    </div>
                    {summary.nextBooking && nextCopy ? (
                      <div className="mt-3 grid gap-1">
                        <p className="font-semibold">Următoarea rezervare</p>
                        <p>{nextCopy.guestName}</p>
                        <p>Check-in: {nextCopy.checkIn}</p>
                        <p>Se eliberează: {nextCopy.checkout}</p>
                        <Link
                          className="button-secondary mt-2 w-full justify-center sm:w-fit"
                          href={`/app/bookings/${summary.nextBooking.id}`}
                        >
                          Vezi rezervarea
                        </Link>
                      </div>
                    ) : (
                      <p className="mt-3 text-ink/65">
                        Nu există rezervări confirmate viitoare pentru această cameră.
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-ink/65">Nu există camere libere acum.</p>
          )}
        </div>

        <div className="rounded-md border border-line bg-mist/40 p-3">
          <h3 className="font-semibold">Camere ocupate</h3>
          {occupiedRooms.length > 0 ? (
            <ul className="mt-3 grid gap-3">
              {occupiedRooms.map((summary) => {
                const room = roomsById.get(summary.roomId);
                const booking = summary.currentBooking;
                const copy = booking
                  ? roomOccupancyBookingCopy(booking, checkInTime, checkOutTime)
                  : null;
                if (!room || !booking || !copy) return null;

                return (
                  <li className="rounded-md border border-line bg-white p-3 text-sm" key={booking.id}>
                    <p className="font-semibold">{room.name}</p>
                    <p className="mt-1 w-fit rounded-md bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-900">
                      Ocupată acum
                    </p>
                    <div className="mt-3 grid gap-1">
                      <p>{copy.guestName}</p>
                      <p>Perioadă: {copy.stayPeriod}</p>
                      <p>Se eliberează: {copy.checkout}</p>
                      {copy.phone ? <p>Telefon: {copy.phone}</p> : null}
                      <p>Email: {copy.email}</p>
                      <p>Status: Confirmată</p>
                      <Link
                        className="button-secondary mt-2 w-full justify-center sm:w-fit"
                        href={`/app/bookings/${booking.id}`}
                      >
                        Vezi rezervarea
                      </Link>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-ink/65">Nu există camere ocupate acum.</p>
          )}
        </div>
      </div>

      <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-amber-950">
        <h3 className="font-semibold">Cereri în așteptare</h3>
        {pendingRequests.length > 0 ? (
          <ul className="mt-3 grid gap-3">
            {pendingRequests.map(({ booking, roomId }) => {
              const room = roomsById.get(roomId);
              const copy = roomOccupancyBookingCopy(booking, checkInTime, checkOutTime);

              return (
                <li className="rounded-md bg-white p-3 text-sm" key={booking.id}>
                  <p className="font-semibold">{room?.name ?? "Cameră"}</p>
                  <p>{copy.guestName}</p>
                  <p>Perioadă: {copy.stayPeriod}</p>
                  <p>Oaspeți: {copy.guestsCount}</p>
                  {copy.phone ? <p>Telefon: {copy.phone}</p> : null}
                  <p>Status: În așteptare</p>
                  <p className="mt-1 font-medium">
                    Nu blochează camera până la confirmare.
                  </p>
                  <Link
                    className="button-secondary mt-2 w-full justify-center sm:w-fit"
                    href={`/app/bookings/${booking.id}`}
                  >
                    Vezi cererea
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="mt-2 text-sm">Nu există cereri în așteptare.</p>
        )}
      </div>
    </section>
  );
}
