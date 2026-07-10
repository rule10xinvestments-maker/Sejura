import { beforeEach, describe, expect, it, vi } from "vitest";

const supabaseMocks = vi.hoisted(() => ({
  createServerClient: vi.fn()
}));

vi.mock("@supabase/ssr", () => ({
  createServerClient: supabaseMocks.createServerClient
}));

describe("Supabase middleware session persistence", () => {
  beforeEach(() => {
    vi.resetModules();
    supabaseMocks.createServerClient.mockReset();
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://supabase.test";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key";
  });

  it("forwards every auth cookie Supabase refreshes", async () => {
    supabaseMocks.createServerClient.mockImplementation(
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
          getUser: async () => {
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

            return { data: { user: { id: "owner-1" } } };
          }
        }
      })
    );

    const { updateSession } = await import("@/lib/supabase/middleware");
    const response = await updateSession({
      cookies: {
        getAll: () => [],
        set: vi.fn()
      },
      headers: new Headers()
    } as never);

    expect(response.cookies.get("sb-access-token")?.value).toBe("access-token");
    expect(response.cookies.get("sb-refresh-token")?.value).toBe("refresh-token");
  });
});
