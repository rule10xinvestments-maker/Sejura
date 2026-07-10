import { NextResponse } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { middleware } from "@/middleware";
import { updateSession } from "@/lib/supabase/middleware";

vi.mock("@/lib/supabase/middleware", () => ({
  updateSession: vi.fn(() => NextResponse.next())
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

  it("refreshes auth cookies without requiring login for public property pages", async () => {
    const response = await middleware(requestFor("/p/pensiunea-sura-mare"));

    expect(updateSession).toHaveBeenCalledTimes(1);
    expect(response.status).toBe(200);
  });

  it("refreshes auth cookies without requiring login for guest discovery", async () => {
    const response = await middleware(requestFor("/guest"));

    expect(updateSession).toHaveBeenCalledTimes(1);
    expect(response.status).toBe(200);
  });

  it("still protects owner dashboard routes", async () => {
    await middleware(requestFor("/app"));

    expect(updateSession).toHaveBeenCalledTimes(1);
  });

  it("refreshes auth cookies while keeping authentication pages public", async () => {
    const signInResponse = await middleware(requestFor("/sign-in"));
    const signUpResponse = await middleware(requestFor("/sign-up"));

    expect(updateSession).toHaveBeenCalledTimes(2);
    expect(signInResponse.status).toBe(200);
    expect(signUpResponse.status).toBe(200);
  });

  it("protects admin routes by default when present", async () => {
    await middleware(requestFor("/admin"));

    expect(updateSession).toHaveBeenCalledTimes(1);
  });

  it("keeps public Jonny conversation routes available without login", async () => {
    const response = await middleware(requestFor("/api/public/conversations/start"));

    expect(updateSession).toHaveBeenCalledTimes(1);
    expect(response.status).toBe(200);
  });
});
