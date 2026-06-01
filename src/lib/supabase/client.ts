import { createBrowserClient } from "@supabase/ssr";
import type { AppSupabaseClient, Database } from "@/lib/supabase/types";

export function createSupabaseBrowserClient(): AppSupabaseClient {
  const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  return supabase as unknown as AppSupabaseClient;
}
