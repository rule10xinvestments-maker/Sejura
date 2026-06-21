"use client";

import React from "react";
import { useEffect, useMemo, useState } from "react";
import type { BookingRecord } from "@/domain/bookings/types";
import type { Room } from "@/domain/rooms/types";

type ManualBookingFormProps = {
  action: (formData: FormData) => void;
  bookings: BookingRecord[];
  propertyId: string;
  rooms: Room[];
};

type RoomPreview = {
  room: Room;
  available: boolean;
  reasons: string[];
  pendingCount: number;
};

function overlaps(startDate: string, endDate: string, otherStart: string, otherEnd: string) {
  return startDate < otherEnd && endDate > otherStart;
}

function formatPrice(value: number | null) {
  return typeof value === "number" ? `${value} RON/noapte` : "Pret nesetat";
}

export function ManualBookingForm({
  action,
  bookings,
  propertyId,
  rooms
}: ManualBookingFormProps) {
  const activeRooms = useMemo(
    () => rooms.filter((room) => room.status === "active"),
    [rooms]
  );
  const [roomId, setRoomId] = useState(activeRooms[0]?.id ?? "");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [guestsCount, setGuestsCount] = useState("");
  const [pricePerNight, setPricePerNight] = useState(
    activeRooms[0]?.base_price_per_night?.toString() ?? ""
  );
  const [priceTouched, setPriceTouched] = useState(false);

  const hasPreviewInput = Boolean(startDate && endDate && Number(guestsCount) > 0);

  const preview = useMemo<RoomPreview[]>(() => {
    if (!hasPreviewInput) return [];

    const guests = Number(guestsCount);
    return activeRooms.map((room) => {
      const reasons: string[] = [];

      if (guests > room.max_guests) {
        reasons.push("Capacitate prea mica.");
      }

      const hasOverlap = bookings.some((booking) => {
        return (
          booking.room_id === room.id &&
          booking.status === "confirmed" &&
          !booking.deleted_at &&
          overlaps(startDate, endDate, booking.start_date, booking.end_date)
        );
      });

      if (hasOverlap) {
        reasons.push("Exista deja o rezervare suprapusa.");
      }

      const pendingCount = bookings.filter((booking) => {
        return (
          booking.room_id === room.id &&
          booking.status === "pending" &&
          !booking.deleted_at &&
          overlaps(startDate, endDate, booking.start_date, booking.end_date)
        );
      }).length;

      return {
        room,
        available: reasons.length === 0,
        reasons,
        pendingCount
      };
    });
  }, [activeRooms, bookings, endDate, guestsCount, hasPreviewInput, startDate]);

  const availablePreview = preview.filter((item) => item.available);
  const unavailablePreview = preview.filter((item) => !item.available);
  const pendingPreview = preview.filter((item) => item.pendingCount > 0);
  const selectedRoom = activeRooms.find((room) => room.id === roomId);
  const selectedPreview = preview.find((item) => item.room.id === roomId);
  const selectedUnavailable = Boolean(hasPreviewInput && selectedPreview && !selectedPreview.available);

  useEffect(() => {
    if (!roomId && activeRooms[0]) {
      setRoomId(activeRooms[0].id);
    }
  }, [activeRooms, roomId]);

  useEffect(() => {
    if (!priceTouched && selectedRoom?.base_price_per_night !== null) {
      setPricePerNight(selectedRoom?.base_price_per_night?.toString() ?? "");
    }
  }, [priceTouched, selectedRoom]);

  useEffect(() => {
    if (!hasPreviewInput || roomId) return;
    const firstAvailable = availablePreview[0]?.room.id;
    if (firstAvailable) {
      setRoomId(firstAvailable);
    }
  }, [availablePreview, hasPreviewInput, roomId]);

  useEffect(() => {
    if (!hasPreviewInput || !selectedPreview || selectedPreview.available) return;
    const firstAvailableRoom = availablePreview[0]?.room;
    if (firstAvailableRoom) {
      setRoomId(firstAvailableRoom.id);
      if (!priceTouched) {
        setPricePerNight(firstAvailableRoom.base_price_per_night?.toString() ?? "");
      }
    }
  }, [availablePreview, hasPreviewInput, priceTouched, selectedPreview]);

  function handleRoomChange(nextRoomId: string) {
    setRoomId(nextRoomId);
    const nextRoom = activeRooms.find((room) => room.id === nextRoomId);
    if (!priceTouched) {
      setPricePerNight(nextRoom?.base_price_per_night?.toString() ?? "");
    }
  }

  const orderedRooms =
    hasPreviewInput && preview.length > 0
      ? [...availablePreview, ...unavailablePreview].map((item) => item.room)
      : activeRooms;

  return (
    <form action={action} className="mt-4 grid gap-3 sm:grid-cols-2">
      <input name="propertyId" type="hidden" value={propertyId} />
      <label className="grid gap-1 text-sm font-medium">
        Camera/unitate
        <select
          className="input"
          name="roomId"
          onChange={(event) => handleRoomChange(event.target.value)}
          required
          value={roomId}
        >
          {orderedRooms.map((room) => {
            const roomPreview = preview.find((item) => item.room.id === room.id);
            return (
              <option
                disabled={Boolean(hasPreviewInput && roomPreview && !roomPreview.available)}
                key={room.id}
                value={room.id}
              >
                {room.name} - {formatPrice(room.base_price_per_night)}
                {hasPreviewInput && roomPreview && !roomPreview.available
                  ? " (indisponibila)"
                  : ""}
              </option>
            );
          })}
        </select>
      </label>
      <label className="grid gap-1 text-sm font-medium">
        Status initial
        <select className="input" name="mode" defaultValue="confirmed">
          <option value="confirmed">Confirmată manual</option>
          <option value="pending">În așteptare</option>
        </select>
      </label>
      <label className="grid gap-1 text-sm font-medium">
        Nume oaspete
        <input className="input" name="guestName" required />
      </label>
      <label className="grid gap-1 text-sm font-medium">
        Telefon
        <input className="input" name="guestPhone" />
      </label>
      <label className="grid gap-1 text-sm font-medium">
        Sosire
        <input
          className="input"
          name="startDate"
          onChange={(event) => setStartDate(event.target.value)}
          required
          type="date"
          value={startDate}
        />
      </label>
      <label className="grid gap-1 text-sm font-medium">
        Plecare
        <input
          className="input"
          name="endDate"
          onChange={(event) => setEndDate(event.target.value)}
          required
          type="date"
          value={endDate}
        />
      </label>
      <label className="grid gap-1 text-sm font-medium">
        Oaspeti
        <input
          className="input"
          min="1"
          name="guestsCount"
          onChange={(event) => setGuestsCount(event.target.value)}
          required
          type="number"
          value={guestsCount}
        />
      </label>
      <label className="grid gap-1 text-sm font-medium">
        Pret/noapte (RON)
        <input
          className="input"
          min="0"
          name="pricePerNight"
          onChange={(event) => {
            setPriceTouched(true);
            setPricePerNight(event.target.value);
          }}
          step="1"
          type="number"
          value={pricePerNight}
        />
      </label>

      <div className="rounded-md border border-line bg-cream/40 p-3 text-sm sm:col-span-2">
        <p className="font-semibold">Disponibilitate camere</p>
        {!hasPreviewInput ? (
          <p className="mt-1 text-ink/65">
            Alege sosirea, plecarea si numarul de oaspeti pentru previzualizare.
          </p>
        ) : (
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <div>
              <p className="font-medium text-emerald-800">Disponibile</p>
              {availablePreview.length === 0 ? (
                <p className="mt-1 text-ink/65">Nicio camera disponibila.</p>
              ) : (
                <ul className="mt-2 grid gap-1">
                  {availablePreview.map(({ room }) => (
                    <li key={room.id}>
                      {room.name} - pana la {room.max_guests} oaspeti -{" "}
                      {formatPrice(room.base_price_per_night)}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <p className="font-medium text-red-800">Indisponibile</p>
              {unavailablePreview.length === 0 ? (
                <p className="mt-1 text-ink/65">Nicio camera indisponibila.</p>
              ) : (
                <ul className="mt-2 grid gap-1">
                  {unavailablePreview.map(({ room, reasons }) => (
                    <li key={room.id}>
                      {room.name} - {reasons.join(" ")}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
        {selectedUnavailable ? (
          <p className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-red-800">
            Camera selectata nu este disponibila in intervalul ales. Alege o camera disponibila.
          </p>
        ) : null}
        {hasPreviewInput && pendingPreview.length > 0 ? (
          <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-amber-900">
            <p className="font-medium">Cereri în așteptare în acest interval</p>
            <ul className="mt-1 grid gap-1">
              {pendingPreview.map(({ room, pendingCount }) => (
                <li key={room.id}>
                  {room.name}: {pendingCount} cerere{pendingCount === 1 ? "" : "i"} în așteptare
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>

      <label className="grid gap-1 text-sm font-medium sm:col-span-2">
        Note interne
        <textarea className="input min-h-24" name="guestNotes" />
      </label>
      <button
        className="button-primary sm:col-span-2"
        disabled={selectedUnavailable || (hasPreviewInput && availablePreview.length === 0)}
        type="submit"
      >
        Salveaza rezervarea
      </button>
    </form>
  );
}
