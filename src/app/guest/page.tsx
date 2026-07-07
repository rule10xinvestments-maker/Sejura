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
                      <h3 className="text-xl font-bold text-ink">{property.name}</h3>
                      {property.city ? (
                        <p className="mt-1 text-sm text-ink/65">{property.city}</p>
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

                  <dl className="mt-4 grid gap-2 text-sm text-ink/70 sm:grid-cols-2">
                    {property.checkInTime ? (
                      <div className="rounded-md bg-mist px-3 py-2">
                        <dt className="text-ink/55">Check-in</dt>
                        <dd className="font-semibold text-ink">{property.checkInTime}</dd>
                      </div>
                    ) : null}
                    {property.checkOutTime ? (
                      <div className="rounded-md bg-mist px-3 py-2">
                        <dt className="text-ink/55">Check-out</dt>
                        <dd className="font-semibold text-ink">{property.checkOutTime}</dd>
                      </div>
                    ) : null}
                    {property.activeRoomCount > 0 ? (
                      <div className="rounded-md bg-mist px-3 py-2">
                        <dt className="text-ink/55">Camere</dt>
                        <dd className="font-semibold text-ink">
                          {formatRoomCount(property.activeRoomCount)}
                        </dd>
                      </div>
                    ) : null}
                    {property.fromPrice !== null ? (
                      <div className="rounded-md bg-mist px-3 py-2">
                        <dt className="text-ink/55">De la</dt>
                        <dd className="font-semibold text-ink">
                          {property.fromPrice} RON/noapte
                        </dd>
                      </div>
                    ) : null}
                  </dl>

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
