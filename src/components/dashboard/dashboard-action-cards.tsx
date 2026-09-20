"use client";

import React from "react";
import Link from "next/link";
import {
  roomBlockCopy,
  roomOccupancyBookingCopy,
  type RoomOccupancySummary
} from "@/domain/bookings/room-occupancy-summary";
import type { BookingRecord } from "@/domain/bookings/types";
import type { SafeGoogleCalendarConnection } from "@/domain/google-calendar/types";
import { propertyScopedHref } from "@/domain/properties/navigation";
import type { Property } from "@/domain/properties/types";
import type { Room } from "@/domain/rooms/types";

type DashboardActionCardsProps = {
  property: Property | null;
  rooms: Room[];
  bookings: BookingRecord[];
  occupancySummaries: RoomOccupancySummary[];
  googleConnection: SafeGoogleCalendarConnection | null;
  notifications: {
    unreadCount: number;
    actionItems: Array<{
      id: string;
      title: string;
      href?: string | null;
    }>;
  };
  activation: {
    ready: boolean;
    missingRequirements: string[];
  };
};

const priceFormatter = new Intl.NumberFormat("ro-RO", {
  maximumFractionDigits: 0,
  style: "currency",
  currency: "RON"
});

function moneyCopy(value: number | null, currency = "RON") {
  if (value === null) return null;

  return new Intl.NumberFormat("ro-RO", {
    maximumFractionDigits: 0,
    style: "currency",
    currency
  }).format(value);
}

function roomPriceCopy(room: Room) {
  return `${priceFormatter.format(room.base_price_per_night)}/noapte`;
}

function googleCalendarStatusCopy(
  connection: SafeGoogleCalendarConnection | null,
  hasSyncFailure: boolean
) {
  if (hasSyncFailure || connection?.status === "error") return "Sincronizare eșuată";
  if (connection?.status === "connected") return "Google Calendar conectat";
  if (connection?.status === "needs_reconnect") return "Google Calendar neconectat";
  return "Google Calendar neconectat";
}

function CardButton({
  id,
  label,
  value,
  active,
  onClick
}: {
  id: string;
  label: string;
  value: string | number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      aria-controls={`${id}-panel`}
      aria-expanded={active}
      className={
        active
          ? "min-h-24 rounded-md border border-moss bg-mist p-3 text-left shadow-soft"
          : "min-h-24 rounded-md border border-line bg-white p-3 text-left transition hover:border-clay hover:shadow-soft focus:outline-none focus:ring-2 focus:ring-clay/30"
      }
      onClick={onClick}
      type="button"
    >
      <span className="text-xs font-semibold uppercase text-ink/55">{label}</span>
      <span className="mt-1 block text-2xl font-bold">{value}</span>
      <span className="mt-2 block text-sm font-semibold text-clay">
        {active ? "Ascunde detalii" : "Vezi detalii"}
      </span>
    </button>
  );
}

function DetailPanel({
  id,
  children
}: {
  id: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="rounded-md border border-line bg-white p-4 shadow-soft"
      id={`${id}-panel`}
    >
      {children}
    </div>
  );
}

function bookingRoomName(booking: BookingRecord, roomsById: Map<string, Room>) {
  return roomsById.get(booking.room_id)?.name ?? "Cameră";
}

export function DashboardActionCards({
  property,
  rooms,
  bookings,
  occupancySummaries,
  googleConnection,
  notifications,
  activation
}: DashboardActionCardsProps) {
  const [openCard, setOpenCard] = React.useState<string | null>(null);
  const propertyId = property?.id;
  const visibleRooms = propertyId
    ? rooms.filter((room) => room.property_id === propertyId)
    : rooms;
  const visibleBookings = propertyId
    ? bookings.filter((booking) => booking.property_id === propertyId)
    : bookings;
  const activeRooms = visibleRooms.filter((room) => room.status === "active");
  const activeRoomIds = new Set(activeRooms.map((room) => room.id));
  const roomsById = new Map(visibleRooms.map((room) => [room.id, room]));
  const summaries = occupancySummaries.filter((summary) =>
    activeRoomIds.has(summary.roomId)
  );
  const occupiedRooms = summaries.filter((summary) => summary.status === "occupied");
  const blockedRooms = summaries.filter((summary) => summary.status === "blocked");
  const futureReservedRooms = summaries.filter((summary) => summary.nextBooking);
  const freeRooms = summaries.filter(
    (summary) => summary.status === "free" || summary.status === "free-now"
  );
  const pendingBookings = visibleBookings.filter(
    (booking) => booking.status === "pending" && !booking.deleted_at
  );
  const confirmedBookings = visibleBookings.filter(
    (booking) => booking.status === "confirmed" && !booking.deleted_at
  );
  const failedSyncBookings = confirmedBookings.filter(
    (booking) =>
      booking.calendar_sync_status === "failed" ||
      booking.calendar_sync_status === "needs_reconnect"
  );
  const googleStatus = googleCalendarStatusCopy(
    googleConnection,
    failedSyncBookings.length > 0
  );
  const actionItems = [
    ...notifications.actionItems,
    ...failedSyncBookings.map((booking) => ({
      id: `sync-${booking.id}`,
      title: `Sincronizare eșuată pentru ${booking.guest_name}`,
      href: propertyScopedHref(`/app/bookings/${booking.id}`, propertyId)
    })),
    ...pendingBookings.map((booking) => ({
      id: `pending-${booking.id}`,
      title: `Cerere în așteptare: ${booking.guest_name}`,
      href: propertyScopedHref(`/app/bookings/${booking.id}`, propertyId)
    })),
    ...activation.missingRequirements.map((item, index) => ({
      id: `setup-${index}`,
      title: item,
      href: propertyScopedHref("/app/property", propertyId)
    }))
  ];

  const toggleCard = (id: string) => {
    setOpenCard((current) => (current === id ? null : id));
  };

  return (
    <section className="space-y-3" aria-label="Acțiuni panou proprietar">
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-5">
        <CardButton
          active={openCard === "property"}
          id="property"
          label="Proprietate"
          onClick={() => toggleCard("property")}
          value={property ? "1" : "0"}
        />
        <CardButton
          active={openCard === "rooms"}
          id="rooms"
          label="Camere active"
          onClick={() => toggleCard("rooms")}
          value={activeRooms.length}
        />
        <CardButton
          active={openCard === "confirmed"}
          id="confirmed"
          label="Rezervări active"
          onClick={() => toggleCard("confirmed")}
          value={confirmedBookings.length}
        />
        <CardButton
          active={openCard === "pending"}
          id="pending"
          label="Rezervări în așteptare"
          onClick={() => toggleCard("pending")}
          value={pendingBookings.length}
        />
        <CardButton
          active={openCard === "actions"}
          id="actions"
          label="Acțiuni noi"
          onClick={() => toggleCard("actions")}
          value={actionItems.length}
        />
      </div>

      {openCard === "property" ? (
        <DetailPanel id="property">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold">Detalii proprietate</h2>
              <p className="mt-1 text-sm text-ink/70">
                {property?.name ?? "Proprietate neconfigurată"}
              </p>
              <p className="text-sm text-ink/65">
                {property?.city ?? "Localitate nesetată"}
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              {property ? (
                <Link className="button-secondary justify-center" href={`/p/${property.slug}`}>
                  Pagina publică
                </Link>
              ) : null}
              <Link
                className="button-primary justify-center"
                href={propertyScopedHref("/app/property", propertyId)}
              >
                Configurează proprietatea
              </Link>
            </div>
          </div>
          <dl className="mt-4 grid grid-cols-2 gap-2 text-sm sm:grid-cols-3">
            <div className="rounded-md bg-mist/50 p-3">
              <dt className="text-ink/60">Camere active</dt>
              <dd className="font-semibold">{activeRooms.length}</dd>
            </div>
            <div className="rounded-md bg-mist/50 p-3">
              <dt className="text-ink/60">Libere acum</dt>
              <dd className="font-semibold">{freeRooms.length}</dd>
            </div>
            <div className="rounded-md bg-mist/50 p-3">
              <dt className="text-ink/60">Ocupate acum</dt>
              <dd className="font-semibold">{occupiedRooms.length}</dd>
            </div>
            <div className="rounded-md bg-mist/50 p-3">
              <dt className="text-ink/60">Rezervate viitor</dt>
              <dd className="font-semibold">{futureReservedRooms.length}</dd>
            </div>
            <div className="rounded-md bg-mist/50 p-3">
              <dt className="text-ink/60">Cereri în așteptare</dt>
              <dd className="font-semibold">{pendingBookings.length}</dd>
            </div>
            <div className="rounded-md bg-mist/50 p-3">
              <dt className="text-ink/60">Calendar Sejura activ</dt>
              <dd className="font-semibold">{googleStatus}</dd>
            </div>
          </dl>
          <p className="mt-3 text-sm text-ink/70">Personal: nesetat</p>
        </DetailPanel>
      ) : null}

      {openCard === "rooms" ? (
        <DetailPanel id="rooms">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-semibold">Camere active</h2>
            <Link
              className="button-secondary min-h-10 justify-center px-3 py-2"
              href={propertyScopedHref("/app/rooms", propertyId)}
            >
              Gestionează camere
            </Link>
          </div>
          {visibleRooms.length > 0 ? (
            <ul className="mt-3 grid gap-3">
              {visibleRooms.map((room) => {
                const summary = summaries.find((item) => item.roomId === room.id);
                const currentCopy = summary?.currentBooking
                  ? roomOccupancyBookingCopy(
                      summary.currentBooking,
                      property?.check_in_time,
                      property?.check_out_time
                    )
                  : null;
                const nextCopy = summary?.nextBooking
                  ? roomOccupancyBookingCopy(
                      summary.nextBooking,
                      property?.check_in_time,
                      property?.check_out_time
                    )
                  : null;
                const block = summary?.currentBlock
                  ? roomBlockCopy(summary.currentBlock)
                  : null;
                const state =
                  room.status !== "active" || summary?.status === "blocked"
                    ? "Indisponibilă"
                    : summary?.status === "occupied"
                      ? "Ocupată acum"
                      : summary?.nextBooking
                        ? "Rezervată viitor"
                        : "Liberă acum";

                return (
                  <li className="rounded-md border border-line p-3 text-sm" key={room.id}>
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="font-semibold">{room.name}</p>
                        <p className="text-ink/65">
                          {room.max_guests} oaspeți · {roomPriceCopy(room)}
                        </p>
                      </div>
                      <p className="w-fit rounded-md bg-mist px-2 py-1 text-xs font-semibold text-moss">
                        {state}
                      </p>
                    </div>
                    {currentCopy && summary?.currentBooking ? (
                      <div className="mt-3 grid gap-1">
                        <p>{currentCopy.guestName}</p>
                        <p>Perioadă: {currentCopy.stayPeriod}</p>
                        <p>Se eliberează: {currentCopy.checkout}</p>
                        {currentCopy.phone ? <p>Telefon: {currentCopy.phone}</p> : null}
                        <Link
                          className="button-secondary mt-2 w-full justify-center sm:w-fit"
                          href={propertyScopedHref(
                            `/app/bookings/${summary.currentBooking.id}`,
                            propertyId
                          )}
                        >
                          Vezi rezervarea
                        </Link>
                      </div>
                    ) : null}
                    {nextCopy && summary?.nextBooking ? (
                      <div className="mt-3 grid gap-1">
                        <p>Următoarea rezervare: {nextCopy.guestName}</p>
                        <p>Perioadă: {nextCopy.stayPeriod}</p>
                        <p>Se ocupă de la: {nextCopy.checkIn}</p>
                        <p>Se eliberează: {nextCopy.checkout}</p>
                        <Link
                          className="button-secondary mt-2 w-full justify-center sm:w-fit"
                          href={propertyScopedHref(
                            `/app/bookings/${summary.nextBooking.id}`,
                            propertyId
                          )}
                        >
                          Vezi rezervarea
                        </Link>
                      </div>
                    ) : null}
                    {block ? (
                      <p className="mt-3 text-ink/70">
                        Indisponibilă: {block.period}. Motiv: {block.reason}
                      </p>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-ink/65">Nu ai camere configurate încă.</p>
          )}
        </DetailPanel>
      ) : null}

      {openCard === "confirmed" ? (
        <DetailPanel id="confirmed">
          <h2 className="text-lg font-semibold">Rezervări active</h2>
          {confirmedBookings.length > 0 ? (
            <ul className="mt-3 grid gap-3">
              {confirmedBookings.map((booking) => {
                const copy = roomOccupancyBookingCopy(
                  booking,
                  property?.check_in_time,
                  property?.check_out_time
                );
                const total = moneyCopy(booking.total_estimated_price, booking.currency);

                return (
                  <li className="rounded-md border border-line p-3 text-sm" key={booking.id}>
                    <p className="font-semibold">{booking.guest_name}</p>
                    <p>{bookingRoomName(booking, roomsById)}</p>
                    <p>Perioadă: {copy.stayPeriod}</p>
                    {copy.phone ? <p>Telefon: {copy.phone}</p> : null}
                    {total ? <p>Total estimat: {total}</p> : null}
                    <Link
                      className="button-secondary mt-2 w-full justify-center sm:w-fit"
                      href={propertyScopedHref(`/app/bookings/${booking.id}`, propertyId)}
                    >
                      Vezi rezervarea
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-ink/65">Nu există rezervări active.</p>
          )}
        </DetailPanel>
      ) : null}

      {openCard === "pending" ? (
        <DetailPanel id="pending">
          <h2 className="text-lg font-semibold">Rezervări în așteptare</h2>
          {pendingBookings.length > 0 ? (
            <ul className="mt-3 grid gap-3">
              {pendingBookings.map((booking) => {
                const copy = roomOccupancyBookingCopy(
                  booking,
                  property?.check_in_time,
                  property?.check_out_time
                );
                const total = moneyCopy(booking.total_estimated_price, booking.currency);

                return (
                  <li className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950" key={booking.id}>
                    <p className="font-semibold">{booking.guest_name}</p>
                    <p>Cameră cerută: {bookingRoomName(booking, roomsById)}</p>
                    <p>Perioadă: {copy.stayPeriod}</p>
                    {copy.phone ? <p>Telefon: {copy.phone}</p> : null}
                    {total ? <p>Total estimat: {total}</p> : null}
                    <p className="mt-1 font-medium">
                      Nu blochează camera până la confirmare.
                    </p>
                    <Link
                      className="button-secondary mt-2 w-full justify-center sm:w-fit"
                      href={propertyScopedHref(`/app/bookings/${booking.id}`, propertyId)}
                    >
                      Verifică cererea
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-ink/65">Nu există rezervări în așteptare.</p>
          )}
        </DetailPanel>
      ) : null}

      {openCard === "actions" ? (
        <DetailPanel id="actions">
          <h2 className="text-lg font-semibold">Acțiuni noi</h2>
          {actionItems.length > 0 ? (
            <ul className="mt-3 grid gap-2 text-sm">
              {actionItems.map((item) => (
                <li className="rounded-md border border-line p-3" key={item.id}>
                  {item.href ? (
                    <Link className="font-semibold text-clay" href={item.href}>
                      {item.title}
                    </Link>
                  ) : (
                    <span className="font-semibold">{item.title}</span>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-ink/65">Nu ai acțiuni noi momentan.</p>
          )}
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <Link
              className="button-secondary justify-center"
              href={propertyScopedHref("/app/bookings", propertyId)}
            >
              Vezi rezervări
            </Link>
            <Link
              className="button-secondary justify-center"
              href={propertyScopedHref("/app/calendar", propertyId)}
            >
              Vezi calendarul
            </Link>
          </div>
        </DetailPanel>
      ) : null}
    </section>
  );
}
