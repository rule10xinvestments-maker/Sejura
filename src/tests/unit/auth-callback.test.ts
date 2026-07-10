import { beforeEach, describe, expect, it, vi } from "vitest";

const oauthMocks = vi.hoisted(() => ({
  createServerClient: vi.fn(),
  exchangeCodeForSession: vi.fn()
}));

vi.mock("@supabase/ssr", () => ({
  createServerClient: oauthMocks.createServerClient
}));

describe("Google auth callback", () => {
  beforeEach(() => {
    vi.resetModules();
    oauthMocks.createServerClient.mockReset();
    oauthMocks.exchangeCodeForSession.mockReset();
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://supabase.test";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key";
  });

  it("redirects missing code safely", async () => {
    const { GET } = await import("@/app/auth/callback/route");
    const response = await GET(
      new Request("https://sejura.test/auth/callback?next=/app") as never
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "https://sejura.test/sign-in?error=google-auth-missing-code"
    );
  });

  it("persists OAuth session cookies on the redirect response", async () => {
    oauthMocks.createServerClient.mockImplementation(
      (_url: string, _key: string, options: {
        cookies: {
          setAll: (cookies: Array<{
            name: string;
            value: string;
            options: { path: string; sameSite: "lax" };
          }>) => void;
        };
      }) => ({
        auth: {
          exchangeCodeForSession: async (code: string) => {
            oauthMocks.exchangeCodeForSession(code);
            options.cookies.setAll([
              {
                name: "sb-access-token",
                value: "access-token",
                options: { path: "/", sameSite: "lax" }
              },
              {
                name: "sb-refresh-token",
                value: "refresh-token",
                options: { path: "/", sameSite: "lax" }
              }
            ]);

            return { error: null };
          }
        }
      })
    );

    const { GET } = await import("@/app/auth/callback/route");
    const response = await GET({
      url: "https://sejura.test/auth/callback?code=oauth-code&next=/app",
      cookies: {
        getAll: () => []
      }
    } as never);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("https://sejura.test/app");
    expect(oauthMocks.exchangeCodeForSession).toHaveBeenCalledWith("oauth-code");
    expect(response.cookies.get("sb-access-token")?.value).toBe("access-token");
    expect(response.cookies.get("sb-refresh-token")?.value).toBe("refresh-token");
  });
});
