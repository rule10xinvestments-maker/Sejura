import { createBrowserClient } from "@supabase/ssr";
import { resolveSupabasePublicEnv } from "@/lib/env";
import type { AppSupabaseClient, Database } from "@/lib/supabase/types";

export function createSupabaseBrowserClient(): AppSupabaseClient {
  const { url, publicKey } = resolveSupabasePublicEnv({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  });
  const supabase = createBrowserClient<Database>(
    url,
    publicKey
  );

  return supabase as unknown as AppSupabaseClient;
}
