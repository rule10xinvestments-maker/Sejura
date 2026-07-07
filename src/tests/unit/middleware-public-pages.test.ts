import { NextResponse } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { middleware } from "@/middleware";
import { updateSession } from "@/lib/supabase/middleware";

vi.mock("@/lib/supabase/middleware", () => ({
  updateSession: vi.fn(() => NextResponse.redirect("https://sejura.test/sign-in"))
}));

function requestFor(pathname: string) {
  return {
    nextUrl: new URL(`https://sejura.test${pathname}`)
  } as never;
}

describe("middleware public routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does not require login for public property pages", async () => {
    const response = await middleware(requestFor("/p/pensiunea-sura-mare"));

    expect(updateSession).not.toHaveBeenCalled();
    expect(response.status).toBe(200);
  });

  it("still protects owner dashboard routes", async () => {
    await middleware(requestFor("/app"));

    expect(updateSession).toHaveBeenCalledTimes(1);
  });

  it("keeps authentication pages public", async () => {
    await middleware(requestFor("/sign-in"));
    await middleware(requestFor("/sign-up"));

    expect(updateSession).not.toHaveBeenCalled();
  });

  it("protects admin routes by default when present", async () => {
    await middleware(requestFor("/admin"));

    expect(updateSession).toHaveBeenCalledTimes(1);
  });
});
