import { describe, expect, it } from "vitest";
import {
  EnvConfigError,
  resolveSupabasePublicEnv
} from "@/lib/env";

describe("resolveSupabasePublicEnv", () => {
  it("resolves the public Supabase key from NEXT_PUBLIC_SUPABASE_ANON_KEY", () => {
    expect(
      resolveSupabasePublicEnv({
        NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
        NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-test-key"
      })
    ).toEqual({
      url: "https://example.supabase.co",
      publicKey: "anon-test-key"
    });
  });

  it("resolves the public Supabase key from NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", () => {
    expect(
      resolveSupabasePublicEnv({
        NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "publishable-test-key"
      })
    ).toEqual({
      url: "https://example.supabase.co",
      publicKey: "publishable-test-key"
    });
  });

  it("throws clear missing variable names when both public key names are missing", () => {
    expect(() =>
      resolveSupabasePublicEnv({
        NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co"
      })
    ).toThrow("NEXT_PUBLIC_SUPABASE_ANON_KEY or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
  });

  it("does not expose secret values in error messages", () => {
    const secretLikeValue = "secret-value-that-must-not-appear";

    try {
      resolveSupabasePublicEnv({
        NEXT_PUBLIC_SUPABASE_ANON_KEY: secretLikeValue
      });
    } catch (error) {
      expect(error).toBeInstanceOf(EnvConfigError);
      expect(String(error)).toContain("NEXT_PUBLIC_SUPABASE_URL");
      expect(String(error)).not.toContain(secretLikeValue);
    }
  });
});

