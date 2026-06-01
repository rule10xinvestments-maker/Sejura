import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { GoogleCalendarService } from "@/domain/google-calendar/service";
import { ownerSafeGoogleCalendarMessage } from "@/domain/google-calendar/errors";
import { getPrimaryProperty } from "@/domain/properties/service";
import { getCurrentOwnerId } from "@/lib/auth/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type SearchParams = {
  status?: string;
};

const statusLabels = {
  connected: "Conectat",
  needs_reconnect: "Necesita reconectare",
  disconnected: "Deconectat",
  error: "Sincronizare esuata"
} as const;

function callbackMessage(status?: string) {
  if (status === "connected") return "Google Calendar a fost conectat.";
  if (status === "denied") {
    return "Google Calendar nu a putut fi conectat. Incearca din nou sau verifica permisiunile acordate.";
  }
  if (status === "invalid-state" || status === "error") {
    return "Google Calendar nu a putut fi conectat. Incearca din nou.";
  }
  return null;
}

export default async function GoogleCalendarSettingsPage({
  searchParams
}: {
  searchParams?: SearchParams;
}) {
  const supabase = createSupabaseServerClient();
  const ownerId = await getCurrentOwnerId(supabase);
  const property = await getPrimaryProperty(supabase, ownerId);

  async function testConnection() {
    "use server";

    const serverSupabase = createSupabaseServerClient();
    const serverOwnerId = await getCurrentOwnerId(serverSupabase);
    const serverProperty = await getPrimaryProperty(serverSupabase, serverOwnerId);
    if (!serverProperty) {
      redirect("/app/settings/google-calendar?status=error");
    }

    try {
      await new GoogleCalendarService(serverSupabase).testConnection(
        serverOwnerId,
        serverProperty.id
      );
      revalidatePath("/app/settings/google-calendar");
      redirect("/app/settings/google-calendar?status=connected");
    } catch {
      redirect("/app/settings/google-calendar?status=error");
    }
  }

  async function disconnect() {
    "use server";

    const serverSupabase = createSupabaseServerClient();
    const serverOwnerId = await getCurrentOwnerId(serverSupabase);
    const serverProperty = await getPrimaryProperty(serverSupabase, serverOwnerId);
    if (!serverProperty) {
      redirect("/app/settings/google-calendar?status=error");
    }

    await new GoogleCalendarService(serverSupabase).disconnect(
      serverOwnerId,
      serverProperty.id
    );
    revalidatePath("/app/settings/google-calendar");
    redirect("/app/settings/google-calendar?status=disconnected");
  }

  if (!property) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Google Calendar</h1>
        <section className="panel">
          <p className="text-sm text-ink/70">
            Adauga mai intai detaliile proprietatii.
          </p>
          <Link className="button-primary mt-4 inline-flex" href="/app/property">
            Configureaza proprietatea
          </Link>
        </section>
      </div>
    );
  }

  const service = new GoogleCalendarService(supabase);
  const connection = await service.getSafeConnection(ownerId, property.id);
  const message = callbackMessage(searchParams?.status);
  const connectHref = `/api/google-calendar/connect?property_id=${property.id}&next=/app/settings/google-calendar`;

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-semibold text-clay">Setari</p>
        <h1 className="text-2xl font-bold">Google Calendar</h1>
      </div>

      {message ? (
        <p className="rounded-md border border-line bg-white px-3 py-2 text-sm">
          {message}
        </p>
      ) : null}

      <section className="panel">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold">
              {statusLabels[connection.status]}
            </h2>
            <p className="mt-1 text-sm text-ink/70">
              Rezervarile confirmate se sincronizeaza in calendarul ales.
            </p>
          </div>
          <span className="w-fit rounded-md border border-line px-2 py-1 text-xs font-semibold">
            {connection.calendar_name ?? "Calendar principal"}
          </span>
        </div>

        <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-ink/60">Cont Google</dt>
            <dd className="font-medium">
              {connection.google_account_email ?? "Nesetat"}
            </dd>
          </div>
          <div>
            <dt className="text-ink/60">Ultima sincronizare</dt>
            <dd className="font-medium">{connection.last_sync_at ?? "Niciodata"}</dd>
          </div>
          <div>
            <dt className="text-ink/60">Calendar</dt>
            <dd className="font-medium">
              {connection.calendar_name ?? "Calendar principal"}
            </dd>
          </div>
          <div>
            <dt className="text-ink/60">Eroare</dt>
            <dd className="font-medium">
              {connection.last_error_code
                ? ownerSafeGoogleCalendarMessage(connection.last_error_code)
                : "Fara erori"}
            </dd>
          </div>
        </dl>

        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <Link className="button-primary" href={connectHref}>
            {connection.status === "connected"
              ? "Reconecteaza Google Calendar"
              : "Conecteaza Google Calendar"}
          </Link>
          <form action={testConnection}>
            <button className="button-secondary w-full" type="submit">
              Testeaza conexiunea
            </button>
          </form>
        </div>
      </section>

      <section className="panel border-amber-200 bg-amber-50">
        <h2 className="text-lg font-semibold">Deconectare</h2>
        <p className="mt-2 text-sm text-amber-950">
          Daca deconectezi Google Calendar, rezervarile noi confirmate nu vor mai
          fi adaugate automat in calendar. Rezervarile existente raman in
          aplicatie.
        </p>
        <form action={disconnect} className="mt-4">
          <button className="button-secondary" type="submit">
            Deconecteaza Google Calendar
          </button>
        </form>
      </section>
    </div>
  );
}
