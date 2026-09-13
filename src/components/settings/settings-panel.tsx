import React from "react";
import Link from "next/link";
import type { PropertySettings } from "@/domain/settings/types";

export function SettingsPanel({
  autoConfirmationAction,
  propertyId,
  publicBookingsAction,
  settings,
  toggleAiAction,
  toggleCalendarRequiredAction
}: {
  autoConfirmationAction: (formData: FormData) => void;
  propertyId: string | null;
  publicBookingsAction: (formData: FormData) => void;
  settings: PropertySettings | null;
  toggleAiAction: (formData: FormData) => void;
  toggleCalendarRequiredAction: (formData: FormData) => void;
}) {
  if (!settings) {
    return (
      <section className="panel">
        <p className="text-sm text-ink/70">
          Setările apar după ce creezi prima proprietate.
        </p>
      </section>
    );
  }

  return (
    <section className="panel">
      <div className="space-y-3">
        <div className="flex flex-col gap-2 border-b border-line pb-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-medium">AI</p>
            <p className="text-sm text-ink/65">
              Activează sau dezactivează asistentul Jonny pentru pagina publică.
            </p>
          </div>
          <form action={toggleAiAction}>
            <input name="propertyId" type="hidden" value={propertyId ?? ""} />
            <input
              name="enabled"
              type="hidden"
              value={settings.ai_enabled ? "false" : "true"}
            />
            <button
              aria-pressed={settings.ai_enabled}
              className={settings.ai_enabled ? "button-primary" : "button-secondary"}
              type="submit"
            >
              {settings.ai_enabled ? "Activat" : "Dezactivat"}
            </button>
          </form>
        </div>

        <div className="flex flex-col gap-2 border-b border-line pb-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-medium">Rezervări publice</p>
            <p className="text-sm text-ink/65">
              Controlează disponibilitatea paginii publice de rezervări.
            </p>
          </div>
          <form action={publicBookingsAction}>
            <input name="propertyId" type="hidden" value={propertyId ?? ""} />
            <input
              name="enabled"
              type="hidden"
              value={settings.public_booking_enabled ? "false" : "true"}
            />
            <button
              aria-pressed={settings.public_booking_enabled}
              className={
                settings.public_booking_enabled ? "button-primary" : "button-secondary"
              }
              type="submit"
            >
              {settings.public_booking_enabled ? "Activat" : "Dezactivat"}
            </button>
          </form>
        </div>

        <div className="flex flex-col gap-2 border-b border-line pb-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-medium">Google Calendar obligatoriu</p>
            <p className="text-sm text-ink/65">
              Când este dezactivat, confirmarea merge în Sejura chiar dacă
              sincronizarea calendarului eșuează.
            </p>
          </div>
          <form action={toggleCalendarRequiredAction}>
            <input name="propertyId" type="hidden" value={propertyId ?? ""} />
            <input
              name="enabled"
              type="hidden"
              value={settings.calendar_required_for_confirmation ? "false" : "true"}
            />
            <button
              aria-pressed={settings.calendar_required_for_confirmation}
              className={
                settings.calendar_required_for_confirmation
                  ? "button-primary"
                  : "button-secondary"
              }
              type="submit"
            >
              {settings.calendar_required_for_confirmation
                ? "Obligatoriu"
                : "Opțional"}
            </button>
          </form>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-medium">Confirmare automată</p>
            <p className="text-sm text-ink/65">
              Pentru pilot, Jonny trimite doar cereri în așteptare către proprietar.
            </p>
          </div>
          <form action={autoConfirmationAction}>
            <input name="propertyId" type="hidden" value={propertyId ?? ""} />
            <button
              aria-describedby="auto-confirmation-pilot-note"
              aria-pressed={false}
              className="button-secondary opacity-75"
              type="submit"
            >
              Dezactivată pentru pilot
            </button>
          </form>
        </div>
      </div>
      <p className="mt-4 text-sm text-ink/65" id="auto-confirmation-pilot-note">
        Pentru pilot, Jonny și cererile publice se folosesc doar în modul în
        așteptare. Confirmarea automată rămâne dezactivată.
      </p>
      <Link
        className="button-secondary mt-4 inline-flex"
        href="/app/settings/google-calendar"
      >
        Setări Google Calendar
      </Link>
    </section>
  );
}
