import { SettingsPanel } from "@/components/settings/settings-panel";
import { getPrimaryProperty } from "@/domain/properties/service";
import { getPropertySettings } from "@/domain/settings/service";
import { getCurrentOwnerId } from "@/lib/auth/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function SettingsPage() {
  const supabase = createSupabaseServerClient();
  const ownerId = await getCurrentOwnerId(supabase);
  const property = await getPrimaryProperty(supabase, ownerId);
  const settings = property
    ? await getPropertySettings(supabase, ownerId, property.id)
    : null;

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-semibold text-clay">Setari</p>
        <h1 className="text-2xl font-bold">Reguli sigure pilot</h1>
      </div>
      <SettingsPanel settings={settings} />
    </div>
  );
}
