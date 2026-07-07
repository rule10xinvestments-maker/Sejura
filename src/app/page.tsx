import Image from "next/image";
import Link from "next/link";
import React from "react";
import { SejuraLogo } from "@/components/brand/sejura-logo";

function SearchIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5 shrink-0"
      fill="none"
      viewBox="0 0 24 24"
    >
      <path
        d="m20 20-4.5-4.5m2-5A7 7 0 1 1 3.5 10.5a7 7 0 0 1 14 0Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

const ownerHighlights = [
  "Adaugi camerele",
  "Urmaresti calendarul",
  "Raspunzi mai usor la cereri"
];

export default function HomePage() {
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
      <div className="pointer-events-none absolute inset-0 bg-[#f4f1e8]/35" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-[#f4f1e8]/20 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-[#eef4f0]/45 to-transparent" />

      <section className="relative mx-auto flex min-h-[100svh] max-w-6xl flex-col px-4 pb-5 pt-4 sm:px-6 sm:pb-8 sm:pt-6">
        <nav className="flex items-center justify-between gap-3">
          <SejuraLogo size="sm" />
          <Link className="button-secondary min-h-10 px-4" href="/sign-in">
            Intră în cont
          </Link>
        </nav>

        <div className="flex flex-1 flex-col justify-center gap-5 py-5 sm:gap-6 sm:py-10 lg:py-12">
          <div className="mx-auto max-w-3xl text-center">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-clay sm:text-sm">
              Bine ai venit
            </p>
            <h1 className="text-4xl font-bold leading-[1.05] text-ink sm:text-5xl lg:text-6xl">
              Ce vrei sa faci in Sejura?
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-ink/75 sm:text-xl">
              Descoperi pensiuni, cabane si vile locale sau administrezi o
              proprietate intr-un calendar intern simplu.
            </p>
          </div>

          <div className="grid gap-3 lg:grid-cols-2 lg:gap-5">
            <article className="rounded-lg border border-line bg-white/90 p-4 shadow-soft backdrop-blur sm:p-6">
              <div className="inline-flex rounded-md bg-[#f7efe2] px-3 py-2 text-sm font-semibold text-clay">
                Pentru oaspeți
              </div>
              <h2 className="mt-3 text-2xl font-bold text-ink">Caut cazare</h2>
              <p className="mt-3 text-sm leading-6 text-ink/75 sm:text-base">
                Vezi pensiuni, cabane și vile locale fără cont.
              </p>
              <p className="mt-2 text-sm leading-6 text-ink/75 sm:text-base">
                Alege o unitate, verifică informațiile și trimite o cerere de
                cazare.
              </p>
              <div className="mt-4 rounded-lg border border-line bg-mist/80 p-3 text-sm leading-6 text-ink/75">
                <p>
                  Paginile publice Sejura pot fi folosite ca mini-site pentru
                  pensiuni care nu au un website propriu.
                </p>
                <p className="mt-2">
                  Linkul poate fi trimis pe WhatsApp, Facebook, Instagram sau
                  Google Business.
                </p>
              </div>
              <div className="mt-4">
                <Link
                  className="button-primary inline-flex min-h-12 items-center gap-2 px-5 text-base"
                  href="/guest"
                >
                  <SearchIcon />
                  <span>Caută cazare</span>
                </Link>
              </div>
            </article>

            <article className="rounded-lg border border-line bg-white/88 p-4 shadow-soft backdrop-blur sm:p-6">
              <div className="flex items-start gap-3">
                <SejuraLogo showText={false} size="md" />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-clay">
                    Pentru proprietari
                  </p>
                  <h2 className="mt-1 text-2xl font-bold text-ink">
                    Am o pensiune, cabană sau vilă
                  </h2>
                </div>
              </div>
              <p className="mt-4 text-sm leading-6 text-ink/75 sm:text-base">
                Administrează camerele, cererile și rezervările într-un calendar
                intern simplu.
              </p>
              <details className="mt-4 rounded-lg border border-line bg-mist/80 p-3 text-sm text-ink/75">
                <summary className="cursor-pointer font-semibold text-moss">
                  Vezi beneficiile pentru proprietari
                </summary>
                <ul className="mt-3 grid gap-2">
                  {ownerHighlights.map((highlight) => (
                    <li className="rounded-md bg-white/75 px-3 py-2" key={highlight}>
                      {highlight}
                    </li>
                  ))}
                </ul>
              </details>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <Link className="button-primary min-h-12 px-5 text-base" href="/app">
                  Administrează proprietatea
                </Link>
                <Link className="button-secondary min-h-12 px-5 text-base" href="/sign-up">
                  Creează cont de proprietar
                </Link>
              </div>
            </article>
          </div>
        </div>
      </section>
    </main>
  );
}
