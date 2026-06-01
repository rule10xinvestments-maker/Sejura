import { createClient } from "@supabase/supabase-js";
import type { AppSupabaseClient, Database } from "@/lib/supabase/types";

export function createSupabaseServiceRoleClient(): AppSupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY must be configured server-side.");
  }

  return createClient<Database>(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  }) as unknown as AppSupabaseClient;
}
