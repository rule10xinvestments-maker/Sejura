import Link from "next/link";
import { getAdminContext } from "@/app/admin/_lib";
import { SejuraLogo } from "@/components/brand/sejura-logo";

export default async function AdminLayout({
  children
}: {
  children: React.ReactNode;
}) {
  await getAdminContext();

  return (
    <main className="min-h-[100svh] bg-mist">
      <div className="mx-auto max-w-6xl space-y-5 px-4 py-5">
        <header className="flex flex-col gap-3 border-b border-line pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <SejuraLogo size="sm" />
            <p className="mt-2 text-sm font-semibold text-clay">Admin Sejura</p>
          </div>
          <nav className="flex flex-wrap gap-2 text-sm">
            <Link className="button-secondary min-h-10 px-3 py-2" href="/admin">
              Dashboard
            </Link>
            <Link className="button-secondary min-h-10 px-3 py-2" href="/admin/owners">
              Conturi proprietari
            </Link>
            <Link className="button-secondary min-h-10 px-3 py-2" href="/app">
              Panou proprietar
            </Link>
          </nav>
        </header>
        {children}
      </div>
    </main>
  );
}
