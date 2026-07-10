import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { SetAllCookies } from "@supabase/ssr";
import { resolveSupabasePublicEnv } from "@/lib/env";
import type { Database } from "@/lib/supabase/types";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const { url, publicKey } = resolveSupabasePublicEnv();

  const supabase = createServerClient<Database>(
    url,
    publicKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: Parameters<SetAllCookies>[0]) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
          });

          response = NextResponse.next({ request });

          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        }
      }
    }
  );

  await supabase.auth.getUser();
  return response;
}
