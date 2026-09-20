import Link from "next/link";
import React from "react";
import { DashboardActionCards } from "@/components/dashboard/dashboard-action-cards";
import {
  buildRoomOccupancySummaries,
  todayInBucharest
} from "@/domain/bookings/room-occupancy-summary";
import { loadDashboardData } from "@/domain/dashboard/service";
import { propertyScopedHref } from "@/domain/properties/navigation";
import { getCurrentOwnerId } from "@/lib/auth/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function DashboardPage({
  searchParams
}: {
  searchParams?: { propertyId?: string };
}) {
  const supabase = createSupabaseServerClient();
  const ownerId = await getCurrentOwnerId(supabase);
  const {
    property,
    rooms,
    bookings,
    roomBlocks,
    googleConnection,
    notifications,
    activation
  } = await loadDashboardData(supabase, ownerId, searchParams?.propertyId);
  const occupancySummaries = property
    ? buildRoomOccupancySummaries({
        rooms,
        bookings,
        roomBlocks,
        today: todayInBucharest(),
        checkInTime: property.check_in_time,
        checkOutTime: property.check_out_time
      })
    : [];

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-semibold text-clay">Panou proprietar</p>
        <h1 className="text-2xl font-bold">Bun venit in Sejura</h1>
      </div>

      <section className="grid gap-2 sm:grid-cols-3">
        <Link
          className="button-primary min-h-11 justify-center"
          href={propertyScopedHref("/app/rooms", property?.id)}
        >
          Camere
        </Link>
        <Link
          className="button-secondary min-h-11 justify-center"
          href={propertyScopedHref("/app/calendar", property?.id)}
        >
          Vezi calendarul intern
        </Link>
        <Link
          className="button-secondary min-h-11 justify-center"
          href={propertyScopedHref("/app/bookings", property?.id)}
        >
          Rezervari
        </Link>
        {property ? (
          <Link
            className="button-secondary min-h-11 justify-center"
            href={`/p/${property.slug}`}
          >
            Pagina pentru oaspeti
          </Link>
        ) : (
          <Link className="button-secondary min-h-11 justify-center" href="/app/property">
            Pagina publica
          </Link>
        )}
      </section>

      <DashboardActionCards
        activation={activation}
        bookings={bookings}
        googleConnection={googleConnection}
        notifications={notifications}
        occupancySummaries={occupancySummaries}
        property={property}
        rooms={rooms}
      />

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
            href={propertyScopedHref("/app/settings/google-calendar", property?.id)}
          >
            Reconnecteaza Google Calendar
          </Link>
        </section>
      ) : null}

      <section className="panel">
        <h2 className="text-lg font-semibold">Urmatorii pasi</h2>
        {activation.ready ? (
          <p className="mt-2 text-sm text-ink/70">
            Fundatia este completa pentru pilot. Cererile publice raman in
            asteptare pana cand proprietarul le confirma.
          </p>
        ) : (
          <ul className="mt-3 space-y-2 text-sm text-ink/75">
            {activation.missingRequirements.map((item) => (
              <li key={item}>- {item}</li>
            ))}
          </ul>
        )}
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <Link
            className="button-primary"
            href={propertyScopedHref("/app/property", property?.id)}
          >
            Continua configurarea
          </Link>
          <Link
            className="button-secondary"
            href={propertyScopedHref("/app/rooms", property?.id)}
          >
            Gestioneaza camere
          </Link>
          <Link
            className="button-secondary"
            href={propertyScopedHref("/app/bookings", property?.id)}
          >
            Vezi rezervari
          </Link>
          {property ? (
            <Link className="button-secondary" href={`/p/${property.slug}`}>
              Deschide pagina pentru oaspeti
            </Link>
          ) : null}
        </div>
      </section>
    </div>
  );
}
