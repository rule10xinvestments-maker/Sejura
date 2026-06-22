import { createBrowserClient } from "@supabase/ssr";
import { resolveSupabasePublicEnv } from "@/lib/env";
import type { AppSupabaseClient, Database } from "@/lib/supabase/types";

export function createSupabaseBrowserClient(): AppSupabaseClient {
  const { url, publicKey } = resolveSupabasePublicEnv();
  const supabase = createBrowserClient<Database>(
    url,
    publicKey
  );

  return supabase as unknown as AppSupabaseClient;
}
