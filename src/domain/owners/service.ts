import type { AppSupabaseClient } from "@/lib/supabase/types";

export async function ensureOwnerProfile(
  supabase: AppSupabaseClient,
  ownerId: string,
  email: string | null
) {
  const { data, error } = await supabase
    .from("owners")
    .upsert({ id: ownerId, email }, { onConflict: "id" })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data;
}
