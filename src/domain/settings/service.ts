import type { AppSupabaseClient } from "@/lib/supabase/types";

export type PilotSettingKey = "ai_enabled" | "public_booking_enabled";

export async function getPropertySettings(
  supabase: AppSupabaseClient,
  ownerId: string,
  propertyId: string
) {
  const { data, error } = await supabase
    .from("property_settings")
    .select("*")
    .eq("owner_id", ownerId)
    .eq("property_id", propertyId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

export async function updatePilotSetting(
  supabase: AppSupabaseClient,
  ownerId: string,
  propertyId: string,
  key: PilotSettingKey,
  enabled: boolean
) {
  const { data: property, error: propertyError } = await supabase
    .from("properties")
    .select("id")
    .eq("owner_id", ownerId)
    .eq("id", propertyId)
    .maybeSingle();

  if (propertyError) {
    throw propertyError;
  }

  if (!property) {
    throw new Error("Proprietatea nu a fost gasita.");
  }

  const settingsPatch =
    key === "ai_enabled"
      ? { ai_enabled: enabled, allow_auto_confirmation: false }
      : { public_booking_enabled: enabled, allow_auto_confirmation: false };

  const { data: settings, error: settingsError } = await supabase
    .from("property_settings")
    .update(settingsPatch)
    .eq("owner_id", ownerId)
    .eq("property_id", propertyId)
    .select("*")
    .single();

  if (settingsError) {
    throw settingsError;
  }

  if (key === "public_booking_enabled") {
    const { error: publicPageError } = await supabase
      .from("property_public_pages")
      .update({
        is_public: enabled,
        chat_enabled: enabled
      })
      .eq("owner_id", ownerId)
      .eq("property_id", propertyId);

    if (publicPageError) {
      throw publicPageError;
    }
  }

  return settings;
}

export async function keepAutoConfirmationDisabled(
  supabase: AppSupabaseClient,
  ownerId: string,
  propertyId: string
) {
  const { data: property, error: propertyError } = await supabase
    .from("properties")
    .select("id")
    .eq("owner_id", ownerId)
    .eq("id", propertyId)
    .maybeSingle();

  if (propertyError) {
    throw propertyError;
  }

  if (!property) {
    throw new Error("Proprietatea nu a fost gasita.");
  }

  const { data, error } = await supabase
    .from("property_settings")
    .update({ allow_auto_confirmation: false })
    .eq("owner_id", ownerId)
    .eq("property_id", propertyId)
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data;
}
