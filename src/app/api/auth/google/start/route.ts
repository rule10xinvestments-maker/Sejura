import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { resolveSupabasePublicEnv } from "@/lib/env";
import { checkSupabaseReachability } from "@/lib/supabase/health";
import type { Database } from "@/lib/supabase/types";

function getSafeNextPath(nextPath: string | null) {
  if (!nextPath || !nextPath.startsWith("/") || nextPath.startsWith("//")) {
    return "/app";
  }

  return nextPath;
}

function signInRedirect(origin: string, error: string, next: string) {
  const url = new URL("/sign-in", origin);
  url.searchParams.set("error", error);
  url.searchParams.set("next", next);
  return NextResponse.redirect(url);
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const next = getSafeNextPath(requestUrl.searchParams.get("next"));
  const health = await checkSupabaseReachability(process.env, 1500);

  if (!health.ok) {
    console.warn("[auth] Supabase unavailable before Google OAuth start", {
      reason: health.reason,
      host: health.host
    });
    return signInRedirect(requestUrl.origin, "supabase-unavailable", next);
  }

  try {
    const { url, publicKey } = resolveSupabasePublicEnv();
    const supabase = createServerClient<Database>(url, publicKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll() {
          // OAuth start does not need to set cookies; callback persists the session.
        }
      }
    });
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${requestUrl.origin}/auth/callback?next=${encodeURIComponent(next)}`
      }
    });

    if (error || !data.url) {
      console.warn("[auth] Google OAuth start failed", error);
      return signInRedirect(requestUrl.origin, "google-auth-start-failed", next);
    }

    return NextResponse.redirect(data.url);
  } catch (error) {
    console.warn("[auth] Google OAuth start crashed", error);
    return signInRedirect(requestUrl.origin, "google-auth-start-failed", next);
  }
}
