import Image from "next/image";
import Link from "next/link";
import React from "react";
import { SejuraLogo } from "@/components/brand/sejura-logo";

function MapPinIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-6 w-6 shrink-0"
      fill="none"
      viewBox="0 0 24 24"
    >
      <path
        d="M12 21s7-5.2 7-12a7 7 0 1 0-14 0c0 6.8 7 12 7 12Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
      <path
        d="M12 12.2a2.7 2.7 0 1 0 0-5.4 2.7 2.7 0 0 0 0 5.4Z"
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
              <Link
                aria-label="Caută cazare"
                className="mt-3 inline-flex items-center gap-3 rounded-lg pr-3 text-left transition hover:text-moss focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-moss"
                href="/guest"
              >
                <span
                  aria-hidden="true"
                  className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-moss text-white"
                  data-testid="guest-card-icon"
                >
                  <MapPinIcon />
                </span>
                <h2 className="text-2xl font-bold text-ink">Caut cazare</h2>
              </Link>
              <p className="mt-3 text-sm leading-6 text-ink/75 sm:text-base">
                Vezi pensiuni, cabane și vile locale fără cont.
              </p>
              <p className="mt-2 text-sm leading-6 text-ink/75 sm:text-base">
                Alege o unitate, verifică informațiile și trimite o cerere de
                cazare.
              </p>
            </article>

            <article className="rounded-lg border border-line bg-white/88 p-4 shadow-soft backdrop-blur sm:p-6">
              <div className="flex items-start gap-3">
                <span
                  className="inline-flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl [&_img]:h-12 [&_img]:w-12 [&_img]:object-contain"
                  data-testid="owner-card-icon"
                >
                  <SejuraLogo showText={false} size="md" />
                </span>
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
                <div className="mt-3 rounded-md bg-white/75 px-3 py-3 leading-6">
                  <p>
                    Pagina publică Sejura poate fi folosită ca mini-site pentru
                    pensiunea ta, chiar dacă nu ai un website propriu.
                  </p>
                  <p className="mt-2">
                    Poți trimite linkul pe WhatsApp, Facebook, Instagram sau
                    Google Business.
                  </p>
                </div>
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
