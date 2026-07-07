import { SejuraLogo } from "@/components/brand/sejura-logo";

export default function AccountSuspendedPage() {
  return (
    <main className="flex min-h-[100svh] items-center justify-center bg-mist px-4">
      <section className="w-full max-w-md rounded-lg border border-line bg-white p-5 shadow-soft">
        <SejuraLogo size="sm" />
        <h1 className="mt-6 text-2xl font-bold">Cont suspendat</h1>
        <p className="mt-3 text-sm text-ink/75">
          Contul este suspendat temporar. Contactează echipa Sejura.
        </p>
      </section>
    </main>
  );
}
