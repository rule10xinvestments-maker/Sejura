import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-mist">
      <section className="mx-auto flex min-h-screen max-w-5xl flex-col justify-between px-5 py-6">
        <nav className="flex items-center justify-between">
          <span className="text-lg font-bold text-ink">Sejura</span>
          <Link className="button-secondary" href="/sign-in">
            Intra in cont
          </Link>
        </nav>

        <div className="grid gap-8 py-12 md:grid-cols-[1.1fr_0.9fr] md:items-center">
          <div className="max-w-2xl">
            <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-clay">
              Pentru proprietari locali
            </p>
            <h1 className="text-4xl font-bold leading-tight text-ink md:text-6xl">
              Sejura
            </h1>
            <p className="mt-4 text-xl text-ink/80">
              Asistent de rezervari pentru pensiuni, cabane si vile locale.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link className="button-primary" href="/sign-up">
                Creeaza cont
              </Link>
              <Link className="button-secondary" href="/sign-in">
                Continua
              </Link>
            </div>
          </div>

          <div className="panel">
            <h2 className="text-lg font-semibold">Sprint 1: fundatie sigura</h2>
            <ul className="mt-4 space-y-3 text-sm text-ink/75">
              <li>Profil proprietar si autentificare Supabase.</li>
              <li>Configurare proprietate, setari si camere fizice.</li>
              <li>Verificare activare fara rezervari, calendar sau AI.</li>
            </ul>
          </div>
        </div>
      </section>
    </main>
  );
}
