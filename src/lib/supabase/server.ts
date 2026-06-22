import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { SetAllCookies } from "@supabase/ssr";
import { resolveSupabasePublicEnv } from "@/lib/env";
import type { AppSupabaseClient, Database } from "@/lib/supabase/types";

export function createSupabaseServerClient(): AppSupabaseClient {
  const cookieStore = cookies();
  const { url, publicKey } = resolveSupabasePublicEnv();

  const supabase = createServerClient<Database>(
    url,
    publicKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: Parameters<SetAllCookies>[0]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Server Components cannot write cookies; middleware/server actions can.
          }
        }
      }
    }
  );

  return supabase as unknown as AppSupabaseClient;
}
