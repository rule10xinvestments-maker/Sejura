import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { config } from "@/middleware";
import {
  middlewareInternals,
  updateSession
} from "@/lib/supabase/middleware";

function requestFor(pathname: string, cookies: Array<{ name: string; value: string }> = []) {
  const url = new URL(`https://sejura.test${pathname}`);

  return {
    cookies: {
      getAll: () => cookies
    },
    headers: new Headers(),
    nextUrl: {
      clone: () => new URL(url.toString()),
      pathname: url.pathname
    },
    url: url.toString()
  } as never;
}

describe("Supabase middleware session persistence", () => {
  it.each(["/", "/guest", "/p/test-property", "/sign-in", "/sign-up"])(
    "returns public route %s quickly without a Supabase auth lookup",
    (pathname) => {
      const startedAt = performance.now();
      const response = updateSession(requestFor(pathname));
      const elapsedMs = performance.now() - startedAt;

      expect(response.status).toBe(200);
      expect(response.headers.get("location")).toBeNull();
      expect(elapsedMs).toBeLessThan(50);
    }
  );

  it("redirects unauthenticated owner app requests quickly", () => {
    const response = updateSession(requestFor("/app"));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "https://sejura.test/sign-in?next=%2Fapp"
    );
  });

  it("allows authenticated owner app requests and preserves auth cookies", () => {
    const response = updateSession(
      requestFor("/app", [
        {
          name: "sb-project-ref-auth-token",
          value: "session-cookie"
        }
      ])
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
  });

  it("recognizes protected and public paths with simple path checks", () => {
    expect(middlewareInternals.isProtectedPath("/app")).toBe(true);
    expect(middlewareInternals.isProtectedPath("/app/rooms")).toBe(true);
    expect(middlewareInternals.isProtectedPath("/admin")).toBe(true);
    expect(middlewareInternals.isProtectedPath("/guest")).toBe(false);
    expect(middlewareInternals.isPublicPath("/")).toBe(true);
    expect(middlewareInternals.isPublicPath("/guest")).toBe(true);
    expect(middlewareInternals.isPublicPath("/p/test-property")).toBe(true);
    expect(middlewareInternals.isPublicPath("/sign-in")).toBe(true);
    expect(middlewareInternals.isPublicPath("/sign-up")).toBe(true);
  });

  it("excludes static assets and API routes from the middleware matcher", () => {
    expect(config.matcher[0]).toContain("api");
    expect(config.matcher[0]).toContain("_next/static");
    expect(config.matcher[0]).toContain("_next/image");
    expect(config.matcher[0]).toContain("favicon.ico");
    expect(config.matcher[0]).toContain("css");
    expect(config.matcher[0]).toContain("js");
    expect(config.matcher[0]).toContain("woff2");
  });

  it("does not import heavy domain services in middleware", () => {
    const middlewareSource = readFileSync(
      join(process.cwd(), "src", "middleware.ts"),
      "utf8"
    );
    const supabaseMiddlewareSource = readFileSync(
      join(process.cwd(), "src", "lib", "supabase", "middleware.ts"),
      "utf8"
    );
    const source = `${middlewareSource}\n${supabaseMiddlewareSource}`;

    expect(source).not.toContain("@/domain/dashboard");
    expect(source).not.toContain("@/domain/photos");
    expect(source).not.toContain("@/domain/bookings");
    expect(source).not.toContain("@/domain/properties");
    expect(source).not.toContain("@/domain/rooms");
    expect(source).not.toContain("@/domain/settings");
    expect(source).not.toContain("@/domain/google-calendar");
    expect(source).not.toContain("createServerClient");
    expect(source).not.toContain("auth.getUser");
  });
});
