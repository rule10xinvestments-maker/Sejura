import Link from "next/link";
import { getAdminContext } from "@/app/admin/_lib";

export default async function AdminDashboardPage() {
  const { service } = await getAdminContext();
  const summary = await service.getDashboardSummary();

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Admin Sejura</h1>
        <p className="mt-1 text-sm text-ink/65">
          Control intern pentru conturi, pagini publice și date demo.
        </p>
      </div>

      <section className="grid gap-3 sm:grid-cols-4">
        <div className="rounded-md border border-line bg-white p-4">
          <p className="text-sm text-ink/60">Total proprietari</p>
          <p className="mt-2 text-2xl font-bold">{summary.totalOwners}</p>
        </div>
        <div className="rounded-md border border-line bg-white p-4">
          <p className="text-sm text-ink/60">Proprietari activi</p>
          <p className="mt-2 text-2xl font-bold">{summary.activeOwners}</p>
        </div>
        <div className="rounded-md border border-line bg-white p-4">
          <p className="text-sm text-ink/60">Proprietari suspendați</p>
          <p className="mt-2 text-2xl font-bold">{summary.suspendedOwners}</p>
        </div>
        <div className="rounded-md border border-line bg-white p-4">
          <p className="text-sm text-ink/60">Proprietăți dezactivate</p>
          <p className="mt-2 text-2xl font-bold">{summary.disabledProperties}</p>
        </div>
      </section>

      <section className="rounded-md border border-line bg-white p-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold">Conturi pilot/demo recente</h2>
          <Link className="button-primary min-h-10 px-3 py-2" href="/admin/owners">
            Conturi proprietari
          </Link>
        </div>
        {summary.recentPilotOwners.length > 0 ? (
          <ul className="mt-4 grid gap-3">
            {summary.recentPilotOwners.map((item) => (
              <li
                className="flex flex-col gap-2 rounded-md border border-line p-3 sm:flex-row sm:items-center sm:justify-between"
                key={item.owner.id}
              >
                <div>
                  <p className="font-semibold">{item.owner.email ?? "Email nesetat"}</p>
                  <p className="text-sm text-ink/65">
                    {item.propertyCount} proprietăți · status {item.owner.account_status}
                  </p>
                </div>
                <Link
                  className="button-secondary min-h-10 justify-center px-3 py-2"
                  href={`/admin/owners/${item.owner.id}`}
                >
                  Vezi contul
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-ink/65">Nu există conturi demo recente.</p>
        )}
      </section>
    </div>
  );
}
