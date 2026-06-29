import Image from "next/image";
import Link from "next/link";
import { SejuraLogo } from "@/components/brand/sejura-logo";

export default function GuestPage() {
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
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-[#eef4f0]/45 to-transparent" />

      <section className="relative mx-auto flex min-h-[100svh] max-w-3xl flex-col px-4 pb-6 pt-4 sm:px-6 sm:pt-6">
        <nav className="flex items-center justify-between gap-3">
          <Link href="/">
            <SejuraLogo size="sm" />
          </Link>
          <Link className="button-secondary min-h-10 px-4" href="/sign-in">
            Intra in cont
          </Link>
        </nav>

        <div className="flex flex-1 items-center py-5 sm:py-8">
          <section className="w-full rounded-lg border border-line bg-white/90 p-5 shadow-soft backdrop-blur sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-clay">
              Cazari locale
            </p>
            <h1 className="mt-3 text-3xl font-bold leading-tight text-ink sm:text-4xl">
              Interfata pentru oaspeti este in pregatire
            </h1>
            <p className="mt-4 text-base leading-7 text-ink/75">
              In curand vei putea vedea pensiuni si trimite cereri de rezervare
              prin Sejura.
            </p>
            <div className="mt-6 grid gap-3 sm:flex">
              <Link className="button-primary min-h-12 px-5 text-base" href="/">
                Inapoi la Sejura
              </Link>
              <Link className="button-secondary min-h-12 px-5 text-base" href="/sign-in">
                Intra ca proprietar
              </Link>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
