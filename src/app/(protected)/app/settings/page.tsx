import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { SettingsPanel } from "@/components/settings/settings-panel";
import { getPrimaryProperty } from "@/domain/properties/service";
import {
  getPropertySettings,
  keepAutoConfirmationDisabled,
  updatePilotSetting
} from "@/domain/settings/service";
import { getCurrentOwnerId } from "@/lib/auth/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type SearchParams = {
  status?: string;
};

function statusMessage(status?: string) {
  if (status === "ai-enabled") return "AI a fost activat.";
  if (status === "ai-disabled") return "AI a fost dezactivat.";
  if (status === "public-enabled") return "Rezervarile publice au fost activate.";
  if (status === "public-disabled") return "Rezervarile publice au fost dezactivate.";
  if (status === "calendar-required") {
    return "Google Calendar este obligatoriu pentru confirmarea rezervarilor.";
  }
  if (status === "calendar-optional") {
    return "Confirmarea rezervarilor este permisa si fara Google Calendar.";
  }
  if (status === "auto-disabled") return "Confirmarea automata este dezactivata pentru pilot.";
  if (status === "error") return "Setarile nu au putut fi salvate. Incearca din nou.";
  return null;
}

export default async function SettingsPage({
  searchParams
}: {
  searchParams?: SearchParams;
}) {
  const supabase = createSupabaseServerClient();
  const ownerId = await getCurrentOwnerId(supabase);
  const property = await getPrimaryProperty(supabase, ownerId);
  const settings = property
    ? await getPropertySettings(supabase, ownerId, property.id)
    : null;

  async function toggleAi(formData: FormData) {
    "use server";

    const serverSupabase = createSupabaseServerClient();
    const serverOwnerId = await getCurrentOwnerId(serverSupabase);
    const propertyId = String(formData.get("propertyId") ?? "");
    const enabled = String(formData.get("enabled")) === "true";

    try {
      await updatePilotSetting(
        serverSupabase,
        serverOwnerId,
        propertyId,
        "ai_enabled",
        enabled
      );
    } catch {
      redirect("/app/settings?status=error");
    }

    revalidatePath("/app/settings");
    redirect(`/app/settings?status=${enabled ? "ai-enabled" : "ai-disabled"}`);
  }

  async function togglePublicBookings(formData: FormData) {
    "use server";

    const serverSupabase = createSupabaseServerClient();
    const serverOwnerId = await getCurrentOwnerId(serverSupabase);
    const propertyId = String(formData.get("propertyId") ?? "");
    const enabled = String(formData.get("enabled")) === "true";

    try {
      await updatePilotSetting(
        serverSupabase,
        serverOwnerId,
        propertyId,
        "public_booking_enabled",
        enabled
      );
    } catch {
      redirect("/app/settings?status=error");
    }

    revalidatePath("/app/settings");
    redirect(`/app/settings?status=${enabled ? "public-enabled" : "public-disabled"}`);
  }

  async function toggleCalendarRequired(formData: FormData) {
    "use server";

    const serverSupabase = createSupabaseServerClient();
    const serverOwnerId = await getCurrentOwnerId(serverSupabase);
    const propertyId = String(formData.get("propertyId") ?? "");
    const enabled = String(formData.get("enabled")) === "true";

    try {
      await updatePilotSetting(
        serverSupabase,
        serverOwnerId,
        propertyId,
        "calendar_required_for_confirmation",
        enabled
      );
    } catch {
      redirect("/app/settings?status=error");
    }

    revalidatePath("/app/settings");
    redirect(
      `/app/settings?status=${enabled ? "calendar-required" : "calendar-optional"}`
    );
  }

  async function keepAutoConfirmationOff(formData: FormData) {
    "use server";

    const serverSupabase = createSupabaseServerClient();
    const serverOwnerId = await getCurrentOwnerId(serverSupabase);
    const propertyId = String(formData.get("propertyId") ?? "");

    try {
      await keepAutoConfirmationDisabled(serverSupabase, serverOwnerId, propertyId);
    } catch {
      redirect("/app/settings?status=error");
    }

    revalidatePath("/app/settings");
    redirect("/app/settings?status=auto-disabled");
  }

  const message = statusMessage(searchParams?.status);

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-semibold text-clay">Setari</p>
        <h1 className="text-2xl font-bold">Reguli sigure pilot</h1>
      </div>
      {message ? (
        <p
          className={`rounded-md border px-3 py-2 text-sm ${
            searchParams?.status === "error"
              ? "border-red-200 bg-red-50 text-red-800"
              : "border-emerald-200 bg-emerald-50 text-emerald-800"
          }`}
        >
          {message}
        </p>
      ) : null}
      <SettingsPanel
        autoConfirmationAction={keepAutoConfirmationOff}
        propertyId={property?.id ?? null}
        publicBookingsAction={togglePublicBookings}
        settings={settings}
        toggleAiAction={toggleAi}
        toggleCalendarRequiredAction={toggleCalendarRequired}
      />
    </div>
  );
}
