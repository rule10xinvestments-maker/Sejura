"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { BookingRecord } from "@/domain/bookings/types";

type BookingAction = "confirm" | "reject" | "cancel";

type BookingActionButtonsProps = {
  bookingId: string;
  status: BookingRecord["status"];
  checkOutTime?: string | null;
};

type BookingActionError = {
  code?: string;
  error?: string;
  conflict?: {
    bookingId: string;
    guestName: string;
    guestPhone: string | null;
    startDate: string;
    endDate: string;
  };
};

type BookingConflictDetail = NonNullable<BookingActionError["conflict"]>;

const successMessages: Record<BookingAction, string> = {
  confirm: "confirmed",
  reject: "rejected",
  cancel: "cancelled"
};

function ownerSafeError(
  action: BookingAction,
  status: number,
  body?: BookingActionError
) {
  if (status === 401 || status === 403 || status === 404) {
    return "Nu am putut procesa actiunea pentru aceasta rezervare.";
  }

  if (body?.code === "ROOM_NOT_AVAILABLE") {
    return "Camera nu mai este disponibilă pentru perioada aleasă.";
  }

  if (body?.code === "GOOGLE_CALENDAR_REQUIRED") {
    return "Google Calendar trebuie conectat înainte de confirmare.";
  }

  if (action === "confirm" && status === 409) {
    return (
      body?.error ??
      "Nu se poate confirma rezervarea. Verifică disponibilitatea camerei."
    );
  }

  if (action === "reject" && status === 409) {
    return "Rezervarea nu mai poate fi respinsa.";
  }

  if (action === "cancel" && status === 409) {
    return "Rezervarea nu mai poate fi anulata.";
  }

  return "Actiunea nu a putut fi finalizata. Incearca din nou.";
}

export function BookingActionButtons({
  bookingId,
  status,
  checkOutTime
}: BookingActionButtonsProps) {
  const router = useRouter();
  const [pendingAction, setPendingAction] = useState<BookingAction | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [conflict, setConflict] = useState<BookingConflictDetail | null>(null);

  async function runAction(action: BookingAction) {
    if (pendingAction) return;

    setError(null);
    setConflict(null);
    setPendingAction(action);

    try {
      const response = await fetch(`/api/bookings/${bookingId}/${action}`, {
        method: "POST"
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => undefined)) as
          | BookingActionError
          | undefined;
        setError(ownerSafeError(action, response.status, body));
        setConflict(body?.code === "ROOM_NOT_AVAILABLE" ? body.conflict ?? null : null);
        return;
      }

      router.replace(`/app/bookings/${bookingId}?message=${successMessages[action]}`);
      router.refresh();
    } catch {
      setError("Conexiunea a fost intrerupta. Incearca din nou.");
    } finally {
      setPendingAction(null);
    }
  }

  const isPending = Boolean(pendingAction);

  return (
    <div className="mt-5">
      {error ? (
        <div
          aria-live="polite"
          className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
        >
          <p>{error}</p>
          {conflict ? (
            <div className="mt-3 space-y-1 text-red-900">
              <p>Camera este deja ocupată de {conflict.guestName}.</p>
              <p>
                Perioadă: {conflict.startDate} – {conflict.endDate}
              </p>
              <p>
                Se eliberează: {conflict.endDate}
                {checkOutTime ? ` la ${checkOutTime}` : ""}
              </p>
              {conflict.guestPhone ? <p>Telefon: {conflict.guestPhone}</p> : null}
              <a
                className="inline-block font-semibold underline"
                href={`/app/bookings/${conflict.bookingId}`}
              >
                Vezi rezervarea existentă
              </a>
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="flex flex-col gap-2 sm:flex-row">
        {status === "pending" ? (
          <>
            <div className="flex-1">
              <p className="mb-2 text-xs text-ink/60">
                Confirma doar dupa ce ai verificat cererea oaspetelui.
              </p>
              <button
                className="button-primary w-full"
                disabled={isPending}
                onClick={() => runAction("confirm")}
                type="button"
              >
                {pendingAction === "confirm"
                  ? "Se confirma..."
                  : "Confirma rezervarea"}
              </button>
            </div>

            <div className="flex-1">
              <p className="mb-2 text-xs text-ink/60">
                Respingerea pastreaza istoricul, dar nu blocheaza camera.
              </p>
              <button
                className="button-secondary w-full disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isPending}
                onClick={() => runAction("reject")}
                type="button"
              >
                {pendingAction === "reject"
                  ? "Se respinge..."
                  : "Respinge rezervarea"}
              </button>
            </div>
          </>
        ) : null}

        {status === "pending" || status === "confirmed" ? (
          <div className="flex-1">
            <p className="mb-2 text-xs text-ink/60">
              Anularea elibereaza intervalul pentru alte rezervari.
            </p>
            <button
              className="button-secondary w-full disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isPending}
              onClick={() => runAction("cancel")}
              type="button"
            >
              {pendingAction === "cancel"
                ? "Se anuleaza..."
                : "Anuleaza rezervarea"}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
