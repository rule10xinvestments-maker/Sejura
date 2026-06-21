"use client";

import React from "react";
import { useId, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { RoomFormState } from "@/domain/rooms/form-state";
import type { Room } from "@/domain/rooms/types";

type RoomFormProps = {
  propertyId: string;
  room?: Room;
  action: (
    state: RoomFormState,
    formData: FormData
  ) => Promise<RoomFormState>;
};

export function RoomForm({ propertyId, room, action }: RoomFormProps) {
  const router = useRouter();
  const formId = useId();
  const roomNameId = `${formId}-room-name`;
  const roomNameHelperId = `${formId}-room-name-helper`;
  const roomNameErrorId = `${formId}-room-name-error`;
  const [state, setState] = useState<RoomFormState>({});
  const [isPending, startTransition] = useTransition();

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const nextState = await action(state, formData);
      setState(nextState);
      if (nextState.message) {
        router.refresh();
      }
    });
  }

  return (
    <form className="grid gap-3" onSubmit={onSubmit}>
      <input name="property_id" type="hidden" value={propertyId} />
      {room ? <input name="room_id" type="hidden" value={room.id} /> : null}

      <div className="block space-y-1">
        <label className="label block" htmlFor={roomNameId}>
          {"Nume camer\u0103/unitate"}
        </label>
        <input
          aria-describedby={
            state.errors?.name
              ? `${roomNameHelperId} ${roomNameErrorId}`
              : roomNameHelperId
          }
          aria-invalid={Boolean(state.errors?.name)}
          className="field"
          defaultValue={room?.name ?? ""}
          id={roomNameId}
          name="name"
        />
        <span className="block text-sm text-ink/65" id={roomNameHelperId}>
          {
            'Foloseste un nume real cu tipul inclus, de exemplu "Camera dubla Verde" sau "Apartament familie".'
          }
        </span>
        {state.errors?.name ? (
          <span className="text-sm text-red-700" id={roomNameErrorId}>
            {state.errors.name}
          </span>
        ) : null}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block space-y-1">
          <span className="label">{"Oaspe\u021bi maximi"}</span>
          <input
            aria-describedby={
              state.errors?.max_guests ? "room-max-guests-error" : undefined
            }
            aria-invalid={Boolean(state.errors?.max_guests)}
            className="field"
            defaultValue={room?.max_guests ?? 2}
            min={1}
            name="max_guests"
            type="number"
          />
          {state.errors?.max_guests ? (
            <span className="text-sm text-red-700" id="room-max-guests-error">
              {state.errors.max_guests}
            </span>
          ) : null}
        </label>

        <label className="block space-y-1">
          <span className="label">{"Pre\u021b/noapte (RON)"}</span>
          <input
            aria-describedby={
              state.errors?.base_price_per_night
                ? "room-base-price-error"
                : undefined
            }
            aria-invalid={Boolean(state.errors?.base_price_per_night)}
            className="field"
            defaultValue={room?.base_price_per_night ?? 200}
            min={1}
            name="base_price_per_night"
            type="number"
          />
          {state.errors?.base_price_per_night ? (
            <span className="text-sm text-red-700" id="room-base-price-error">
              {state.errors.base_price_per_night}
            </span>
          ) : null}
        </label>
      </div>

      <label className="block space-y-1">
        <span className="label">Status</span>
        <select
          aria-describedby={state.errors?.status ? "room-status-error" : undefined}
          aria-invalid={Boolean(state.errors?.status)}
          className="field"
          defaultValue={room?.status ?? "active"}
          name="status"
        >
          <option value="active">Activa</option>
          <option value="inactive">Inactiva</option>
        </select>
        {state.errors?.status ? (
          <span className="text-sm text-red-700" id="room-status-error">
            {state.errors.status}
          </span>
        ) : null}
      </label>

      {state.errors?.form ? (
        <p aria-live="polite" className="text-sm text-red-700">
          {state.errors.form}
        </p>
      ) : null}

      {state.message ? (
        <p aria-live="polite" className="text-sm font-medium text-moss">
          {state.message}
        </p>
      ) : null}

      <button className="button-primary w-full sm:w-auto" disabled={isPending} type="submit">
        {isPending
          ? "Se salveaza..."
          : room
            ? "Salveaz\u0103 modific\u0103rile"
            : "Salveaz\u0103 camera"}
      </button>
    </form>
  );
}
