import { beforeEach, describe, expect, it, vi } from "vitest";

const oauthMocks = vi.hoisted(() => ({
  createServerClient: vi.fn(),
  signInWithOAuth: vi.fn()
}));

vi.mock("@supabase/ssr", () => ({
  createServerClient: oauthMocks.createServerClient
}));

function requestFor(pathname: string) {
  return {
    url: `https://sejura.test${pathname}`,
    cookies: {
      getAll: () => []
    }
  } as never;
}

describe("Google OAuth start route", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllGlobals();
    oauthMocks.createServerClient.mockReset();
    oauthMocks.signInWithOAuth.mockReset();
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://supabase.test";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key";
  });

  it("redirects back to Sejura sign-in when Supabase is unreachable", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("dns failed")));

    const { GET } = await import("@/app/api/auth/google/start/route");
    const response = await GET(requestFor("/api/auth/google/start?next=/app"));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "https://sejura.test/sign-in?error=supabase-unavailable&next=%2Fapp"
    );
    expect(oauthMocks.createServerClient).not.toHaveBeenCalled();
  });

  it("redirects to the Supabase OAuth URL only after health check succeeds", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true
      })
    );
    oauthMocks.createServerClient.mockReturnValue({
      auth: {
        signInWithOAuth: oauthMocks.signInWithOAuth
      }
    });
    oauthMocks.signInWithOAuth.mockResolvedValue({
      data: {
        url: "https://supabase.test/auth/v1/authorize?provider=google"
      },
      error: null
    });

    const { GET } = await import("@/app/api/auth/google/start/route");
    const response = await GET(requestFor("/api/auth/google/start?next=/app"));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "https://supabase.test/auth/v1/authorize?provider=google"
    );
    expect(oauthMocks.signInWithOAuth).toHaveBeenCalledWith({
      provider: "google",
      options: {
        redirectTo: "https://sejura.test/auth/callback?next=%2Fapp"
      }
    });
  });
});
