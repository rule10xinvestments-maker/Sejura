import Image from "next/image";
import Link from "next/link";
import React from "react";
import { SejuraLogo } from "@/components/brand/sejura-logo";
import { getPublicPropertyListings } from "@/domain/public-properties/service";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";

export const dynamic = "force-dynamic";

function formatRoomCount(count: number) {
  if (count === 1) {
    return "1 cameră activă";
  }

  return `${count} camere active`;
}

function formatPublicTime(time: string | null) {
  if (!time) return "-";
  return time.slice(0, 5);
}

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

function LocationIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24">
      <path
        d="M12 21s7-5.2 7-12a7 7 0 1 0-14 0c0 6.8 7 12 7 12Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
      <path
        d="M12 11.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function RoomsIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24">
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

export default async function GuestPage() {
  const supabase = createSupabaseServiceRoleClient();
  const properties = await getPublicPropertyListings(supabase);

  return (
    <main className="relative min-h-[100svh] overflow-hidden bg-[#f4f1e8]">
      <Image
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 h-full w-full object-cover"
        fill
        priority
        sizes="100vw"
        src="/brand/sejura-landing-background-v2.jpg"
      />
      <div className="pointer-events-none absolute inset-0 bg-[#f4f1e8]/45" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-[#eef4f0]/55 to-transparent" />

      <section className="relative mx-auto flex min-h-[100svh] max-w-5xl flex-col px-4 pb-8 pt-4 sm:px-6 sm:pt-6">
        <nav className="flex items-center justify-between gap-3">
          <Link href="/">
            <SejuraLogo size="sm" />
          </Link>
          <Link className="button-secondary min-h-10 px-4" href="/sign-in">
            Intră în cont
          </Link>
        </nav>

        <header className="max-w-3xl py-8 sm:py-12">
          <p className="text-xs font-semibold uppercase tracking-wide text-clay sm:text-sm">
            Cazări recomandate
          </p>
          <h1 className="mt-3 text-4xl font-bold leading-tight text-ink sm:text-5xl">
            Cazări locale
          </h1>
          <p className="mt-4 text-base leading-7 text-ink/75 sm:text-xl">
            Descoperă pensiuni, cabane și vile care primesc cereri prin Sejura.
          </p>
        </header>

        <section
          aria-labelledby="recommended-accommodations"
          className="rounded-lg border border-line bg-white/92 p-4 shadow-soft backdrop-blur sm:p-5"
        >
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-bold text-ink" id="recommended-accommodations">
              Cazări recomandate
            </h2>
            <span className="rounded-md bg-mist px-3 py-2 text-xs font-semibold text-moss">
              Fără cont
            </span>
          </div>

          {properties.length > 0 ? (
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {properties.map((property) => (
                <article
                  className="rounded-lg border border-line bg-white p-4 shadow-soft"
                  key={property.id}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="text-xl font-bold leading-tight text-ink">
                        {property.name}
                      </h3>
                      {property.city ? (
                        <p className="mt-1 inline-flex items-center gap-1 text-sm text-ink/65">
                          <LocationIcon />
                          {property.city}
                        </p>
                      ) : null}
                    </div>
                    <span className="rounded-md bg-[#f7efe2] px-3 py-2 text-xs font-semibold text-clay">
                      Primește cereri prin Sejura
                    </span>
                  </div>

                  {property.publicDescription ? (
                    <p className="mt-3 text-sm leading-6 text-ink/75">
                      {property.publicDescription}
                    </p>
                  ) : null}

                  {property.checkInTime || property.checkOutTime ? (
                    <dl
                      aria-label="Program sosire și plecare"
                      className="mt-4 grid grid-cols-2 gap-2 rounded-md bg-mist p-2 text-sm"
                    >
                      {property.checkInTime ? (
                        <div className="flex items-center gap-2 rounded-md bg-white px-2 py-2">
                          <span aria-label="Sosire" className="text-moss" role="img">
                            <DoorInIcon />
                          </span>
                          <div>
                            <dt className="text-xs text-ink/55">Sosire de la</dt>
                            <dd className="font-semibold text-ink">
                              {formatPublicTime(property.checkInTime)}
                            </dd>
                          </div>
                        </div>
                      ) : null}
                      {property.checkOutTime ? (
                        <div className="flex items-center gap-2 rounded-md bg-white px-2 py-2">
                          <span aria-label="Plecare" className="text-moss" role="img">
                            <DoorOutIcon />
                          </span>
                          <div>
                            <dt className="text-xs text-ink/55">Plecare până la</dt>
                            <dd className="font-semibold text-ink">
                              {formatPublicTime(property.checkOutTime)}
                            </dd>
                          </div>
                        </div>
                      ) : null}
                    </dl>
                  ) : null}

                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-ink/65">
                    {property.activeRoomCount > 0 ? (
                      <span className="inline-flex items-center gap-1 rounded-md bg-mist px-2 py-1">
                        <span aria-label="Camere" className="text-moss" role="img">
                          <RoomsIcon />
                        </span>
                        {formatRoomCount(property.activeRoomCount)}
                      </span>
                    ) : null}
                    {property.fromPrice !== null ? (
                      <span className="inline-flex items-center gap-1 rounded-md bg-mist px-2 py-1">
                        <span aria-label="Preț" className="text-moss" role="img">
                          <TagIcon />
                        </span>
                        de la {property.fromPrice} RON/noapte
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-4">
                    <Link
                      className="button-primary inline-flex min-h-11 px-4 text-sm"
                      href={`/p/${property.slug}`}
                    >
                      Vezi detalii
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="mt-4 rounded-lg border border-dashed border-line bg-mist/80 p-5 text-ink/75">
              <p className="font-semibold text-ink">
                Încă nu există cazări publice disponibile.
              </p>
              <p className="mt-2">
                Revino în curând sau accesează linkul primit de la pensiune.
              </p>
            </div>
          )}
        </section>
      </section>
    </main>
  );
}
