import Link from "next/link";
import { getAdminContext } from "@/app/admin/_lib";

const statusLabels = {
  active: "Activ",
  suspended: "Suspendat",
  disabled: "Dezactivat",
  deletion_requested: "Marcat pentru ștergere"
};

export default async function AdminOwnersPage() {
  const { service } = await getAdminContext();
  const owners = await service.listOwners();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Conturi proprietari</h1>
        <p className="mt-1 text-sm text-ink/65">
          Vizualizare internă pentru conturile de proprietari Sejura.
        </p>
      </div>

      <section className="grid gap-3">
        {owners.map((item) => (
          <article className="rounded-md border border-line bg-white p-4" key={item.owner.id}>
            <div className="grid gap-3 lg:grid-cols-[1.4fr_1fr_auto] lg:items-center">
              <div>
                <p className="font-semibold">{item.owner.email ?? "Email nesetat"}</p>
                <p className="text-sm text-ink/65">
                  Telefon: {item.phone ?? "Telefon nesetat"}
                </p>
                <p className="text-sm text-ink/65">
                  Creat la: {new Date(item.owner.created_at).toLocaleString("ro-RO")}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4 lg:grid-cols-2">
                <p>Status: {statusLabels[item.owner.account_status]}</p>
                <p>Proprietăți: {item.propertyCount}</p>
                <p>Camere: {item.roomCount}</p>
                <p>Rezervări: {item.bookingCount}</p>
              </div>
              <Link
                className="button-primary min-h-10 justify-center px-3 py-2"
                href={`/admin/owners/${item.owner.id}`}
              >
                Acțiuni
              </Link>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
