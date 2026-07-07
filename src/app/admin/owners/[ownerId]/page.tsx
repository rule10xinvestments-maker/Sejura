import { revalidatePath } from "next/cache";
import { notFound, redirect } from "next/navigation";
import { adminActionMessage, getAdminContext } from "@/app/admin/_lib";
import { AdminActionError } from "@/domain/admin/errors";

const statusLabels = {
  active: "Activ",
  suspended: "Suspendat",
  disabled: "Dezactivat",
  deletion_requested: "Marcat pentru ștergere"
};

function safeFormError(error: unknown) {
  if (error instanceof AdminActionError) return error.message;
  return "Acțiunea nu a putut fi finalizată.";
}

export default async function AdminOwnerDetailPage({
  params,
  searchParams
}: {
  params: { ownerId: string };
  searchParams?: { status?: string; error?: string };
}) {
  const { service } = await getAdminContext();
  const detail = await service.getOwnerDetail(params.ownerId);
  if (!detail) notFound();

  async function suspendOwner(formData: FormData) {
    "use server";

    const { adminId, service: actionService } = await getAdminContext();
    try {
      await actionService.setOwnerStatus({
        actorAdminId: adminId,
        targetOwnerId: params.ownerId,
        status: "suspended",
        reason: String(formData.get("reason") ?? "")
      });
    } catch (error) {
      redirect(
        `/admin/owners/${params.ownerId}?error=${encodeURIComponent(safeFormError(error))}`
      );
    }
    revalidatePath(`/admin/owners/${params.ownerId}`);
    redirect(`/admin/owners/${params.ownerId}?status=owner-suspended`);
  }

  async function reactivateOwner(formData: FormData) {
    "use server";

    const { adminId, service: actionService } = await getAdminContext();
    try {
      await actionService.setOwnerStatus({
        actorAdminId: adminId,
        targetOwnerId: params.ownerId,
        status: "active",
        reason: String(formData.get("reason") ?? "")
      });
    } catch (error) {
      redirect(
        `/admin/owners/${params.ownerId}?error=${encodeURIComponent(safeFormError(error))}`
      );
    }
    revalidatePath(`/admin/owners/${params.ownerId}`);
    redirect(`/admin/owners/${params.ownerId}?status=owner-reactivated`);
  }

  async function markDeletionRequested(formData: FormData) {
    "use server";

    const { adminId, service: actionService } = await getAdminContext();
    try {
      await actionService.setOwnerStatus({
        actorAdminId: adminId,
        targetOwnerId: params.ownerId,
        status: "deletion_requested",
        reason: String(formData.get("reason") ?? "")
      });
    } catch (error) {
      redirect(
        `/admin/owners/${params.ownerId}?error=${encodeURIComponent(safeFormError(error))}`
      );
    }
    revalidatePath(`/admin/owners/${params.ownerId}`);
    redirect(`/admin/owners/${params.ownerId}?status=owner-deletion-requested`);
  }

  async function disableProperty(formData: FormData) {
    "use server";

    const propertyId = String(formData.get("property_id") ?? "");
    const { adminId, service: actionService } = await getAdminContext();
    try {
      await actionService.disableProperty({
        actorAdminId: adminId,
        propertyId,
        reason: String(formData.get("reason") ?? "")
      });
    } catch (error) {
      redirect(
        `/admin/owners/${params.ownerId}?error=${encodeURIComponent(safeFormError(error))}`
      );
    }
    revalidatePath(`/admin/owners/${params.ownerId}`);
    redirect(`/admin/owners/${params.ownerId}?status=property-disabled`);
  }

  async function resetDemoData(formData: FormData) {
    "use server";

    const propertyId = String(formData.get("property_id") ?? "");
    const { adminId, service: actionService } = await getAdminContext();
    try {
      await actionService.resetDemoData({
        actorAdminId: adminId,
        ownerId: params.ownerId,
        propertyId,
        confirmation: String(formData.get("confirmation") ?? ""),
        reason: String(formData.get("reason") ?? "")
      });
    } catch (error) {
      redirect(
        `/admin/owners/${params.ownerId}?error=${encodeURIComponent(safeFormError(error))}`
      );
    }
    revalidatePath(`/admin/owners/${params.ownerId}`);
    redirect(`/admin/owners/${params.ownerId}?status=demo-reset`);
  }

  const message = adminActionMessage(searchParams?.status);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Cont proprietar</h1>
        <p className="mt-1 text-sm text-ink/65">
          Acțiunile de mai jos sunt interne și auditate.
        </p>
      </div>

      {message ? (
        <p className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm font-medium text-emerald-900">
          {message}
        </p>
      ) : null}
      {searchParams?.error ? (
        <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-800">
          {searchParams.error}
        </p>
      ) : null}

      <section className="rounded-md border border-line bg-white p-4">
        <h2 className="text-lg font-semibold">Profil</h2>
        <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-ink/60">Email</dt>
            <dd className="font-medium">{detail.owner.email ?? "Email nesetat"}</dd>
          </div>
          <div>
            <dt className="text-ink/60">Telefon</dt>
            <dd className="font-medium">{detail.phone ?? "Telefon nesetat"}</dd>
          </div>
          <div>
            <dt className="text-ink/60">Status cont</dt>
            <dd className="font-medium">{statusLabels[detail.owner.account_status]}</dd>
          </div>
          <div>
            <dt className="text-ink/60">Creat la</dt>
            <dd className="font-medium">
              {new Date(detail.owner.created_at).toLocaleString("ro-RO")}
            </dd>
          </div>
        </dl>
      </section>

      <section className="rounded-md border border-line bg-white p-4">
        <h2 className="text-lg font-semibold">Acțiuni cont</h2>
        <div className="mt-3 grid gap-3 lg:grid-cols-3">
          <form action={suspendOwner} className="rounded-md border border-line p-3">
            <label className="label" htmlFor="suspend-reason">Motiv acțiune</label>
            <input className="field" id="suspend-reason" name="reason" />
            <button className="button-secondary mt-3 w-full" type="submit">
              Suspendă cont
            </button>
            <p className="mt-2 text-xs text-ink/60">Acțiune auditată</p>
          </form>
          <form action={reactivateOwner} className="rounded-md border border-line p-3">
            <label className="label" htmlFor="reactivate-reason">Motiv acțiune</label>
            <input className="field" id="reactivate-reason" name="reason" />
            <button className="button-secondary mt-3 w-full" type="submit">
              Reactivează cont
            </button>
            <p className="mt-2 text-xs text-ink/60">Acțiune auditată</p>
          </form>
          <form action={markDeletionRequested} className="rounded-md border border-line p-3">
            <label className="label" htmlFor="delete-reason">Motiv acțiune</label>
            <input className="field" id="delete-reason" name="reason" />
            <button className="button-secondary mt-3 w-full" type="submit">
              Marchează pentru ștergere
            </button>
            <p className="mt-2 text-xs text-ink/60">
              Nu șterge datele. Acțiune auditată.
            </p>
          </form>
        </div>
      </section>

      <section className="rounded-md border border-line bg-white p-4">
        <h2 className="text-lg font-semibold">Proprietăți</h2>
        <div className="mt-3 grid gap-3">
          {detail.properties.map((item) => (
            <article className="rounded-md border border-line p-3" key={item.property.id}>
              <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
                <div>
                  <h3 className="font-semibold">{item.property.name}</h3>
                  <p className="text-sm text-ink/65">/{item.property.slug}</p>
                  <p className="mt-2 text-sm">
                    Camere: {item.roomCount} · Rezervări: {item.bookingCount} · Status public:{" "}
                    {item.publicPage?.is_public && item.publicPage.chat_enabled
                      ? "Activ"
                      : "Inactiv"}
                  </p>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <form action={disableProperty} className="rounded-md border border-line p-3">
                    <input name="property_id" type="hidden" value={item.property.id} />
                    <label className="label" htmlFor={`disable-${item.property.id}`}>
                      Motiv acțiune
                    </label>
                    <input className="field" id={`disable-${item.property.id}`} name="reason" />
                    <button className="button-secondary mt-3 w-full" type="submit">
                      Dezactivează pagina publică
                    </button>
                  </form>
                  <form action={resetDemoData} className="rounded-md border border-amber-200 bg-amber-50 p-3">
                    <input name="property_id" type="hidden" value={item.property.id} />
                    <label className="label" htmlFor={`reset-${item.property.id}`}>
                      Resetează date demo
                    </label>
                    <input
                      className="field"
                      id={`reset-${item.property.id}`}
                      name="confirmation"
                      placeholder="Scrie RESET"
                    />
                    <input className="field mt-2" name="reason" placeholder="Motiv acțiune" />
                    <button className="button-secondary mt-3 w-full" type="submit">
                      Resetează date demo
                    </button>
                    <p className="mt-2 text-xs">Acțiune auditată</p>
                  </form>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-md border border-line bg-white p-4">
        <h2 className="text-lg font-semibold">Activitate recentă</h2>
        {detail.recentActivity.length > 0 ? (
          <ul className="mt-3 space-y-2 text-sm">
            {detail.recentActivity.map((item) => (
              <li className="rounded-md border border-line p-3" key={item.id}>
                <p className="font-medium">{item.title}</p>
                <p className="text-ink/60">
                  {new Date(item.created_at).toLocaleString("ro-RO")}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-ink/65">Nu există activitate recentă.</p>
        )}
      </section>
    </div>
  );
}
