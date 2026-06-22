export type RuntimeEnv = Record<string, string | undefined>;

const supabasePublicKeyNames = [
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"
] as const;

export class EnvConfigError extends Error {
  constructor(message: string, readonly missing: string[]) {
    super(message);
    this.name = "EnvConfigError";
  }
}

function present(value: string | undefined) {
  return typeof value === "string" && value.trim().length > 0;
}

export function resolveSupabasePublicEnv(env: RuntimeEnv = process.env) {
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const publicKey =
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const missing: string[] = [];

  if (!present(url)) {
    missing.push("NEXT_PUBLIC_SUPABASE_URL");
  }

  if (!present(publicKey)) {
    missing.push(supabasePublicKeyNames.join(" or "));
  }

  if (missing.length > 0) {
    throw new EnvConfigError(
      `Missing required environment variable(s): ${missing.join(", ")}`,
      missing
    );
  }

  return {
    url: url as string,
    publicKey: publicKey as string
  };
}

export function getMissingServerEnv(
  requiredNames: string[],
  env: RuntimeEnv = process.env
) {
  return requiredNames.filter((name) => !present(env[name]));
}

