import React from "react";
import Link from "next/link";
import { RoomForm } from "@/components/rooms/room-form";
import {
  roomBlockCopy,
  roomOccupancyBookingCopy,
  type RoomOccupancySummary
} from "@/domain/bookings/room-occupancy-summary";
import type { Property } from "@/domain/properties/types";
import type { RoomFormState } from "@/domain/rooms/form-state";
import type { Room } from "@/domain/rooms/types";

type RoomsListProps = {
  property: Property | null;
  rooms: Room[];
  occupancySummaries?: RoomOccupancySummary[];
  checkInTime?: string | null;
  checkOutTime?: string | null;
  successMessage?: string | null;
  saveAction: (
    state: RoomFormState,
    formData: FormData
  ) => Promise<RoomFormState>;
  deactivateAction: (formData: FormData) => void | Promise<void>;
};

export function RoomsList({
  property,
  rooms,
  occupancySummaries = [],
  checkInTime,
  checkOutTime,
  successMessage,
  saveAction,
  deactivateAction
}: RoomsListProps) {
  if (!property) {
    return (
      <section className="panel">
        <h1 className="text-2xl font-bold">Camere</h1>
        <p className="mt-2 text-sm text-ink/70">
          {"Adaug\u0103 mai \u00eent\u00e2i detaliile propriet\u0103\u021bii."}
        </p>
        <Link className="button-primary mt-4" href="/app/property">
          Configureaza proprietatea
        </Link>
      </section>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-clay">Camere fizice</p>
          <h1 className="text-2xl font-bold">Unitati rezervabile</h1>
          <p className="mt-1 text-sm text-ink/65">
            Adauga camerele pe care le pot cere oaspetii in pagina publica.
          </p>
        </div>
        <a className="button-primary min-h-11 justify-center sm:w-auto" href="#camera-noua">
          Adauga camera
        </a>
      </div>

      {successMessage ? (
        <p aria-live="polite" className="rounded-md border border-line bg-white px-3 py-2 text-sm font-medium text-moss">
          {successMessage}
        </p>
      ) : null}

      <section className="panel scroll-mt-28" id="camera-noua">
        <h2 className="mb-4 text-lg font-semibold">Adauga camera</h2>
        <RoomForm action={saveAction} propertyId={property.id} />
      </section>

      <section className="space-y-3">
        {rooms.map((room) => {
          const occupancy = occupancySummaries.find(
            (summary) => summary.roomId === room.id
          );
          const currentBookingCopy = occupancy?.currentBooking
            ? roomOccupancyBookingCopy(
                occupancy.currentBooking,
                checkInTime,
                checkOutTime
              )
            : null;
          const nextBookingCopy = occupancy?.nextBooking
            ? roomOccupancyBookingCopy(
                occupancy.nextBooking,
                checkInTime,
                checkOutTime
              )
            : null;
          const currentBlockCopy = occupancy?.currentBlock
            ? roomBlockCopy(occupancy.currentBlock)
            : null;
          const nextBlockCopy = occupancy?.nextBlock
            ? roomBlockCopy(occupancy.nextBlock)
            : null;

          return (
          <article className="panel" key={room.id}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="font-semibold">{room.name}</h2>
                <p className="text-sm text-ink/65">
                  {room.max_guests} oaspeti - {room.base_price_per_night} RON/noapte
                </p>
                <p
                  className={
                    room.status === "active"
                      ? "mt-2 w-fit rounded-md bg-emerald-50 px-2 py-1 text-xs font-semibold uppercase text-emerald-800"
                      : "mt-2 w-fit rounded-md bg-mist px-2 py-1 text-xs font-semibold uppercase text-ink/65"
                  }
                >
                  {room.status === "active" ? "Activa" : "Inactiva"}
                </p>
              </div>
              {room.status === "active" ? (
                <form action={deactivateAction}>
                  <input name="property_id" type="hidden" value={property.id} />
                  <input name="room_id" type="hidden" value={room.id} />
                  <button className="button-secondary min-h-11 px-3 py-2" type="submit">
                    Dezactiveaza camera
                  </button>
                </form>
              ) : null}
            </div>
            {room.status === "active" && occupancy ? (
              <section className="mt-4 rounded-md border border-line bg-mist/40 p-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-clay">Ocupare camere</p>
                    <p
                      className={
                        occupancy.status === "occupied"
                          ? "mt-1 w-fit rounded-md bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-800"
                          : occupancy.status === "blocked"
                            ? "mt-1 w-fit rounded-md bg-stone-100 px-2 py-1 text-xs font-semibold text-stone-800"
                            : "mt-1 w-fit rounded-md bg-white px-2 py-1 text-xs font-semibold text-ink"
                      }
                    >
                      {occupancy.statusLabel}
                    </p>
                  </div>
                </div>

                {occupancy.currentBooking && currentBookingCopy ? (
                  <div className="mt-3 grid gap-2 text-sm">
                    <p className="font-semibold">{currentBookingCopy.guestName}</p>
                    <p>Perioadă: {currentBookingCopy.stayPeriod}</p>
                    <p>Check-in: {currentBookingCopy.checkIn}</p>
                    <p>Se eliberează: {currentBookingCopy.checkout}</p>
                    <p>Oaspeți: {currentBookingCopy.guestsCount}</p>
                    {currentBookingCopy.phone ? (
                      <p>Telefon: {currentBookingCopy.phone}</p>
                    ) : null}
                    <p>Email: {currentBookingCopy.email}</p>
                    <p>Status rezervare: {currentBookingCopy.statusLabel}</p>
                    <Link
                      className="button-secondary mt-1 w-full justify-center sm:w-fit"
                      href={`/app/bookings/${occupancy.currentBooking.id}`}
                    >
                      Vezi rezervarea
                    </Link>
                  </div>
                ) : null}

                {!occupancy.currentBooking && occupancy.currentBlock && currentBlockCopy ? (
                  <div className="mt-3 grid gap-2 text-sm">
                    <p className="font-semibold">Indisponibilă</p>
                    <p>Perioadă: {currentBlockCopy.period}</p>
                    <p>Motiv: {currentBlockCopy.reason}</p>
                  </div>
                ) : null}

                {!occupancy.currentBooking &&
                !occupancy.currentBlock &&
                occupancy.nextBooking &&
                nextBookingCopy ? (
                  <div className="mt-3 grid gap-2 text-sm">
                    <p className="font-semibold">Următoarea rezervare:</p>
                    <p>{nextBookingCopy.guestName}</p>
                    <p>Se ocupă de la: {nextBookingCopy.checkIn}</p>
                    <p>Se eliberează: {nextBookingCopy.checkout}</p>
                    <p>Status rezervare: {nextBookingCopy.statusLabel}</p>
                    <Link
                      className="button-secondary mt-1 w-full justify-center sm:w-fit"
                      href={`/app/bookings/${occupancy.nextBooking.id}`}
                    >
                      Vezi rezervarea
                    </Link>
                  </div>
                ) : null}

                {!occupancy.currentBooking &&
                !occupancy.currentBlock &&
                !occupancy.nextBooking ? (
                  <p className="mt-3 text-sm text-ink/70">
                    Nu există rezervări confirmate viitoare pentru această cameră.
                  </p>
                ) : null}

                {!occupancy.currentBlock &&
                nextBlockCopy &&
                occupancy.status !== "blocked" ? (
                  <div className="mt-3 rounded-md border border-stone-200 bg-white p-3 text-sm">
                    <p className="font-semibold">Următoarea indisponibilitate</p>
                    <p>Perioadă: {nextBlockCopy.period}</p>
                    <p>Motiv: {nextBlockCopy.reason}</p>
                  </div>
                ) : null}

                {occupancy.pendingBookings.length > 0 ? (
                  <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">
                    <p className="font-semibold">
                      Cereri în așteptare pentru această cameră
                    </p>
                    <p className="mt-1">
                      Nu blochează camera până la confirmare.
                    </p>
                    <ul className="mt-3 grid gap-3">
                      {occupancy.pendingBookings.map((booking) => {
                        const pendingCopy = roomOccupancyBookingCopy(
                          booking,
                          checkInTime,
                          checkOutTime
                        );

                        return (
                          <li className="rounded-md bg-white p-3" key={booking.id}>
                            <p className="font-semibold">{pendingCopy.guestName}</p>
                            <p>Perioadă: {pendingCopy.stayPeriod}</p>
                            <p>Oaspeți: {pendingCopy.guestsCount}</p>
                            {pendingCopy.phone ? (
                              <p>Telefon: {pendingCopy.phone}</p>
                            ) : null}
                            <p>Status: {pendingCopy.statusLabel}</p>
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
                  </div>
                ) : null}
              </section>
            ) : null}
            <details className="mt-4">
              <summary className="cursor-pointer text-sm font-semibold text-moss">
                Editeaza
              </summary>
              <div className="mt-3">
                <RoomForm action={saveAction} propertyId={property.id} room={room} />
              </div>
            </details>
          </article>
          );
        })}
      </section>
    </div>
  );
}
