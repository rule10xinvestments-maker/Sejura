"use client";

import React from "react";
import Link from "next/link";
import {
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

function moneyCopy(value: number | null, currency = "RON") {
  if (value === null) return null;

  return new Intl.NumberFormat("ro-RO", {
    maximumFractionDigits: 0,
    style: "currency",
    currency
  }).format(value);
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

function IndicatorLink({
  href,
  label,
  value
}: {
  href: string;
  label: string;
  value: number;
}) {
  return (
    <Link
      className="inline-flex min-h-8 items-center gap-1.5 rounded-md border border-line bg-white px-2.5 py-1 text-sm font-semibold text-ink shadow-sm transition hover:border-clay"
      href={href}
    >
      <span>{label}</span>
      <span className="rounded bg-mist px-1.5 py-0.5 text-xs text-moss">{value}</span>
    </Link>
  );
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
    <section className="space-y-3" aria-label="Indicatori panou proprietar">
      <div className="flex flex-wrap gap-2">
        <IndicatorLink
          href={propertyScopedHref("/app/rooms", propertyId)}
          label="Camere"
          value={activeRooms.length}
        />
        <IndicatorLink
          href={propertyScopedHref("/app/calendar", propertyId)}
          label="Libere"
          value={freeRooms.length}
        />
        <IndicatorLink
          href={propertyScopedHref("/app/calendar", propertyId)}
          label="Ocupate"
          value={occupiedRooms.length}
        />
        <IndicatorLink
          href={propertyScopedHref("/app/bookings", propertyId)}
          label="Rezervări"
          value={confirmedBookings.length}
        />
        <IndicatorLink
          href={propertyScopedHref("/app/bookings", propertyId)}
          label="Cereri"
          value={pendingBookings.length}
        />
        <button
          aria-controls="actions-panel"
          aria-expanded={openCard === "actions"}
          className="inline-flex min-h-8 items-center gap-1.5 rounded-md border border-line bg-white px-2.5 py-1 text-sm font-semibold text-ink shadow-sm transition hover:border-clay"
          onClick={() => toggleCard("actions")}
          type="button"
        >
          <span>Acțiuni</span>
          <span className="rounded bg-mist px-1.5 py-0.5 text-xs text-moss">
            {actionItems.length}
          </span>
        </button>
      </div>

      <p className="text-xs text-ink/60">
        Calendar Sejura activ · {googleStatus}
      </p>

      {pendingBookings.length > 0 ? (
        <DetailPanel id="pending-requests">
          <h2 className="text-lg font-semibold">Cereri în așteptare</h2>
          <ul className="mt-3 grid gap-3">
            {pendingBookings.map((booking) => {
              const copy = roomOccupancyBookingCopy(
                booking,
                property?.check_in_time,
                property?.check_out_time
              );
              const total = moneyCopy(booking.total_estimated_price, booking.currency);

              return (
                <li
                  className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950"
                  key={booking.id}
                >
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
        </DetailPanel>
      ) : null}

      {occupiedRooms.length > 0 ? (
        <DetailPanel id="occupied-rooms">
          <h2 className="text-lg font-semibold">Camere ocupate acum</h2>
          <ul className="mt-3 grid gap-3">
            {occupiedRooms.map((summary) => {
              const room = roomsById.get(summary.roomId);
              const booking = summary.currentBooking;
              const copy = booking
                ? roomOccupancyBookingCopy(
                    booking,
                    property?.check_in_time,
                    property?.check_out_time
                  )
                : null;

              if (!room || !booking || !copy) return null;

              return (
                <li className="rounded-md border border-line p-3 text-sm" key={room.id}>
                  <p className="font-semibold">{room.name}</p>
                  <p>{copy.guestName}</p>
                  <p>Perioadă: {copy.stayPeriod}</p>
                  <p>Se eliberează: {copy.checkout}</p>
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
        </DetailPanel>
      ) : null}

      {futureReservedRooms.length > 0 ? (
        <DetailPanel id="future-bookings">
          <h2 className="text-lg font-semibold">Următoarele rezervări</h2>
          <ul className="mt-3 grid gap-3">
            {futureReservedRooms.map((summary) => {
              const room = roomsById.get(summary.roomId);
              const booking = summary.nextBooking;
              const copy = booking
                ? roomOccupancyBookingCopy(
                    booking,
                    property?.check_in_time,
                    property?.check_out_time
                  )
                : null;

              if (!room || !booking || !copy) return null;

              return (
                <li className="rounded-md border border-line p-3 text-sm" key={booking.id}>
                  <p className="font-semibold">{room.name}</p>
                  <p>{copy.guestName}</p>
                  <p>Perioadă: {copy.stayPeriod}</p>
                  <p>Se ocupă de la: {copy.checkIn}</p>
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
