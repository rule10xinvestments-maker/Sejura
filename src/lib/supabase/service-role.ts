import { createClient } from "@supabase/supabase-js";
import { resolveSupabasePublicEnv } from "@/lib/env";
import type { AppSupabaseClient, Database } from "@/lib/supabase/types";

export function createSupabaseServiceRoleClient(): AppSupabaseClient {
  const { url } = resolveSupabasePublicEnv();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY must be configured server-side.");
  }

  return createClient<Database>(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  }) as unknown as AppSupabaseClient;
}
