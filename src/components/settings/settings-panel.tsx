import Link from "next/link";
import type { PropertySettings } from "@/domain/settings/types";

export function SettingsPanel({
  settings
}: {
  settings: PropertySettings | null;
}) {
  if (!settings) {
    return (
      <section className="panel">
        <p className="text-sm text-ink/70">
          Setarile apar dupa ce creezi prima proprietate.
        </p>
      </section>
    );
  }

  const rows = [
    ["AI", settings.ai_enabled],
    ["Rezervari publice", settings.public_booking_enabled],
    ["Confirmare automata", settings.allow_auto_confirmation]
  ];

  return (
    <section className="panel">
      <div className="space-y-3">
        {rows.map(([label, enabled]) => (
          <div className="flex items-center justify-between gap-3" key={String(label)}>
            <span className="font-medium">{label}</span>
            <span className="rounded-md bg-mist px-3 py-1 text-sm font-semibold">
              {enabled ? "Activ" : "Dezactivat"}
            </span>
          </div>
        ))}
      </div>
      <p className="mt-4 text-sm text-ink/65">
        Pentru pilot, Jonny si cererile publice se folosesc doar in modul in
        asteptare. Confirmarea automata ramane dezactivata.
      </p>
      <Link
        className="button-secondary mt-4 inline-flex"
        href="/app/settings/google-calendar"
      >
        Setari Google Calendar
      </Link>
    </section>
  );
}
