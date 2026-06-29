import React from "react";
import Link from "next/link";
import { RoomForm } from "@/components/rooms/room-form";
import type { Property } from "@/domain/properties/types";
import type { RoomFormState } from "@/domain/rooms/form-state";
import type { Room } from "@/domain/rooms/types";

type RoomsListProps = {
  property: Property | null;
  rooms: Room[];
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
      <div>
        <p className="text-sm font-semibold text-clay">Camere fizice</p>
        <h1 className="text-2xl font-bold">Unitati rezervabile</h1>
        <p className="mt-1 text-sm text-ink/65">
          Adauga camerele pe care le pot cere oaspetii in pagina publica.
        </p>
      </div>

      {successMessage ? (
        <p aria-live="polite" className="rounded-md border border-line bg-white px-3 py-2 text-sm font-medium text-moss">
          {successMessage}
        </p>
      ) : null}

      <section className="panel">
        <h2 className="mb-4 text-lg font-semibold">Camera noua</h2>
        <RoomForm action={saveAction} propertyId={property.id} />
      </section>

      <section className="space-y-3">
        {rooms.map((room) => (
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
                  <button className="button-secondary min-h-10 px-3 py-1" type="submit">
                    Dezactiveaza
                  </button>
                </form>
              ) : null}
            </div>
            <details className="mt-4">
              <summary className="cursor-pointer text-sm font-semibold text-moss">
                Editeaza
              </summary>
              <div className="mt-3">
                <RoomForm action={saveAction} propertyId={property.id} room={room} />
              </div>
            </details>
          </article>
        ))}
      </section>
    </div>
  );
}
