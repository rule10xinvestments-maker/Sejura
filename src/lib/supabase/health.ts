import { EnvConfigError, resolveSupabasePublicEnv } from "@/lib/env";
import { supabaseFetchWithTimeout } from "@/lib/supabase/fetch";

export type SupabasePublicConfigStatus =
  | {
      ok: true;
      host: string;
    }
  | {
      ok: false;
      reason: "missing-env" | "invalid-url";
      host: null;
      missing?: string[];
    };

export type SupabaseReachabilityStatus =
  | {
      ok: true;
      host: string;
    }
  | {
      ok: false;
      host: string | null;
      reason: "missing-env" | "invalid-url" | "unreachable";
      missing?: string[];
    };

export function getSupabasePublicConfigStatus(
  env: Record<string, string | undefined> = process.env
): SupabasePublicConfigStatus {
  try {
    const { url } = resolveSupabasePublicEnv(env);
    return {
      ok: true,
      host: new URL(url).host
    };
  } catch (error) {
    if (error instanceof EnvConfigError) {
      return {
        ok: false,
        reason: "missing-env",
        host: null,
        missing: error.missing
      };
    }

    return {
      ok: false,
      reason: "invalid-url",
      host: null
    };
  }
}

export async function checkSupabaseReachability(
  env: Record<string, string | undefined> = process.env,
  timeoutMs = 1500
): Promise<SupabaseReachabilityStatus> {
  const config = getSupabasePublicConfigStatus(env);

  if (!config.ok) {
    return config;
  }

  try {
    const { url, publicKey } = resolveSupabasePublicEnv(env);
    const healthUrl = new URL("/auth/v1/health", url);
    const response = await supabaseFetchWithTimeout(
      healthUrl,
      {
        cache: "no-store",
        headers: {
          apikey: publicKey
        }
      },
      timeoutMs
    );

    if (!response.ok) {
      return {
        ok: false,
        host: config.host,
        reason: "unreachable"
      };
    }

    return {
      ok: true,
      host: config.host
    };
  } catch {
    return {
      ok: false,
      host: config.host,
      reason: "unreachable"
    };
  }
}
