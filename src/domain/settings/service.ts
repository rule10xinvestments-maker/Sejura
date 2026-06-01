import type { AppSupabaseClient } from "@/lib/supabase/types";

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
