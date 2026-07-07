import Link from "next/link";
import React from "react";
import { SejuraLogo } from "@/components/brand/sejura-logo";
import { JonnyChat } from "@/components/public/jonny-chat";
import { jonnyIntro, PublicConversationService } from "@/domain/public-chat/service";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";

export const dynamic = "force-dynamic";

function DoorInIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24">
      <path
        d="M4 21h16M7 21V4.5A1.5 1.5 0 0 1 8.5 3H17v18M10 12h6m0 0-2.5-2.5M16 12l-2.5 2.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function DoorOutIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24">
      <path
        d="M4 21h16M7 21V4.5A1.5 1.5 0 0 1 8.5 3H17v18M16 12h-6m0 0 2.5-2.5M10 12l2.5 2.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function BedIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24">
      <path
        d="M4 11V5m0 8h16m0 0v6M4 13v6m2-8h4a2 2 0 0 0 0-4H6v4Zm6 0h6a4 4 0 0 1 4 4v2"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function PersonIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24">
      <path
        d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm7 8a7 7 0 0 0-14 0"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function TagIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24">
      <path
        d="M20 13.5 13.5 20a2 2 0 0 1-2.8 0L4 13.3V4h9.3l6.7 6.7a2 2 0 0 1 0 2.8ZM8 8h.01"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function formatPublicTime(time: string | null) {
  if (!time) return "-";
  return time.slice(0, 5);
}

export default async function PublicPropertyPage({
  params
}: {
  params: { propertySlug: string };
}) {
  const supabase = createSupabaseServiceRoleClient();
  const service = new PublicConversationService(supabase);
  const readiness = await service.getPublicPageReadiness(params.propertySlug);
  const context = readiness.context;
  const ownerClient = createSupabaseServerClient();
  const {
    data: { user }
  } = await ownerClient.auth.getUser();
  const isOwnerViewingOwnPublicPage = Boolean(
    user && context?.property.owner_id === user.id
  );

  if (
    !context ||
    readiness.reason === "PROPERTY_NOT_FOUND" ||
    readiness.reason === "PROPERTY_DISABLED" ||
    readiness.reason === "PUBLIC_DISABLED"
  ) {
    return (
      <main className="min-h-[100svh] bg-mist px-4 py-10">
        <div className="mx-auto max-w-3xl space-y-4">
          <SejuraLogo size="sm" />
          <section className="panel">
            <p>Aceasta pagina de rezervari nu este disponibila momentan.</p>
          </section>
        </div>
      </main>
    );
  }

  if (!readiness.ok) {
    return (
      <main className="min-h-[100svh] bg-mist px-4 py-10">
        <div className="mx-auto max-w-3xl space-y-4">
          <SejuraLogo size="sm" />
          <section className="panel">
            <p>Rezervarile online nu sunt disponibile momentan pentru aceasta pensiune.</p>
          </section>
        </div>
      </main>
    );
  }

  const rooms = readiness.rooms;

  return (
    <main className="min-h-[100svh] bg-mist">
      <div className="mx-auto max-w-3xl space-y-4 px-4 py-4 sm:py-6">
        <header className="flex items-center justify-between gap-3">
          <SejuraLogo size="sm" />
          <div className="flex flex-wrap justify-end gap-2">
            {isOwnerViewingOwnPublicPage ? (
              <Link className="button-primary min-h-10 px-3 py-2 text-sm" href="/app/rooms">
                Administreaza pensiunea
              </Link>
            ) : null}
            <Link className="button-secondary min-h-10 px-3 py-2 text-sm" href="/guest">
              Înapoi la cazări
            </Link>
          </div>
        </header>

        <section className="rounded-lg border border-line bg-white p-4 shadow-soft sm:p-5">
          <p className="text-sm font-semibold text-clay">
            Cerere de rezervare prin Sejura
          </p>
          <h1 className="mt-2 text-3xl font-bold leading-tight">{context.property.name}</h1>
          {context.property.city ? (
            <p className="mt-1 text-ink/70">{context.property.city}</p>
          ) : null}
          {context.property.public_description ? (
            <p className="mt-3 text-ink/75">{context.property.public_description}</p>
          ) : null}
        </section>

        <section
          aria-label="Program check-in și check-out"
          className="grid grid-cols-2 gap-2 rounded-lg border border-line bg-white p-3 shadow-soft"
        >
          <div className="flex items-center gap-2 rounded-md bg-mist px-3 py-2">
            <span className="text-moss">
              <DoorInIcon />
            </span>
            <div>
              <p className="text-xs text-ink/60">Check-in</p>
              <p className="font-semibold">{formatPublicTime(context.property.check_in_time)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-md bg-mist px-3 py-2">
            <span className="text-moss">
              <DoorOutIcon />
            </span>
            <div>
              <p className="text-xs text-ink/60">Check-out</p>
              <p className="font-semibold">{formatPublicTime(context.property.check_out_time)}</p>
            </div>
          </div>
        </section>

        {rooms && rooms.length > 0 ? (
          <section className="rounded-lg border border-line bg-white p-4 shadow-soft">
            <h2
              aria-label="Camere disponibile"
              className="flex items-center gap-2 text-lg font-semibold"
            >
              <span aria-label="Camere" className="text-moss" role="img">
                <BedIcon />
              </span>
              Camere disponibile
            </h2>
            <ul className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
              {rooms.map((room) => (
                <li className="rounded-md border border-line bg-mist/60 p-3" key={room.name}>
                  <p className="font-semibold text-ink">{room.name}</p>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs text-ink/65">
                    <span className="inline-flex items-center gap-1 rounded-md bg-white px-2 py-1">
                      <PersonIcon />
                      până la {room.max_guests} oaspeți
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-md bg-white px-2 py-1">
                      <TagIcon />
                      de la {room.base_price_per_night} RON/noapte
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <JonnyChat propertySlug={params.propertySlug} initialMessage={jonnyIntro} />
      </div>
    </main>
  );
}
