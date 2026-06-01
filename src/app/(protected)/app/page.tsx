import Link from "next/link";
import { loadDashboardData } from "@/domain/dashboard/service";
import { getCurrentOwnerId } from "@/lib/auth/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = createSupabaseServerClient();
  const ownerId = await getCurrentOwnerId(supabase);
  const {
    property,
    rooms,
    bookings,
    googleConnection,
    notifications,
    activation
  } = await loadDashboardData(supabase, ownerId);

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-semibold text-clay">Panou proprietar</p>
        <h1 className="text-2xl font-bold">Bun venit in Sejura</h1>
      </div>

      <section className="grid gap-3 sm:grid-cols-3">
        <div className="panel">
          <p className="text-sm text-ink/60">Proprietate</p>
          <p className="mt-2 text-xl font-bold">{property ? "1" : "0"}</p>
        </div>
        <div className="panel">
          <p className="text-sm text-ink/60">Camere active</p>
          <p className="mt-2 text-xl font-bold">
            {rooms.filter((room) => room.status === "active").length}
          </p>
        </div>
        <div className="panel">
          <p className="text-sm text-ink/60">Activare</p>
          <p className="mt-2 text-xl font-bold">
            {activation.ready ? "Gata" : "In lucru"}
          </p>
        </div>
        <div className="panel sm:col-span-3">
          <p className="text-sm text-ink/60">Rezervari active</p>
          <p className="mt-2 text-xl font-bold">
            {bookings.filter((booking) => booking.status === "confirmed").length}
          </p>
        </div>
        <div className="panel sm:col-span-3">
          <p className="text-sm text-ink/60">Actiuni noi</p>
          <p className="mt-2 text-xl font-bold">{notifications.unreadCount}</p>
        </div>
      </section>

      {googleConnection?.status === "needs_reconnect" ||
      googleConnection?.status === "error" ? (
        <section className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-semibold">Google Calendar trebuie reconectat.</p>
          <p className="mt-1">
            Rezervarile confirmate nu pot fi sincronizate pana cand reconectarea
            este finalizata.
          </p>
          <Link
            className="button-secondary mt-3 inline-flex"
            href="/app/settings/google-calendar"
          >
            Reconnecteaza Google Calendar
          </Link>
        </section>
      ) : null}

      <section className="panel">
        <h2 className="text-lg font-semibold">Urmatorii pasi</h2>
        {activation.ready ? (
          <p className="mt-2 text-sm text-ink/70">
            Fundatia este completa. Functionalitatile AI si rezervari publice raman
            dezactivate in Sprint 1.
          </p>
        ) : (
          <ul className="mt-3 space-y-2 text-sm text-ink/75">
            {activation.missingRequirements.map((item) => (
              <li key={item}>- {item}</li>
            ))}
          </ul>
        )}
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <Link className="button-primary" href="/app/onboarding">
            Continua configurarea
          </Link>
          <Link className="button-secondary" href="/app/rooms">
            Gestioneaza camere
          </Link>
          <Link className="button-secondary" href="/app/bookings">
            Vezi rezervari
          </Link>
        </div>
      </section>

      {notifications.actionItems.length > 0 ? (
        <section className="panel">
          <h2 className="text-lg font-semibold">Actiuni recente</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {notifications.actionItems.map((item) => (
              <li key={item.id}>
                {item.href ? (
                  <Link className="font-medium text-clay" href={item.href}>
                    {item.title}
                  </Link>
                ) : (
                  <span>{item.title}</span>
                )}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
