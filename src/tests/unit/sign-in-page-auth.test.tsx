import React from "react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import SignInPage from "@/app/(auth)/sign-in/page";

const signInMocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  redirect: vi.fn((path: string) => {
    throw new Error(`redirect:${path}`);
  })
}));

vi.mock("next/navigation", () => ({
  redirect: signInMocks.redirect
}));

vi.mock("@/components/auth/auth-form", () => ({
  AuthForm: ({ mode }: { mode: string }) => (
    <div data-testid="auth-form">Auth form: {mode}</div>
  )
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(() => ({
    auth: {
      getUser: signInMocks.getUser
    }
  }))
}));

describe("sign-in page auth state", () => {
  beforeEach(() => {
    signInMocks.getUser.mockReset();
    signInMocks.redirect.mockClear();
  });

  it("redirects an already authenticated user to the owner app", async () => {
    signInMocks.getUser.mockResolvedValue({
      data: { user: { id: "owner-1" } }
    });

    await expect(SignInPage()).rejects.toThrow("redirect:/app");
  });

  it("renders sign-in form for unauthenticated visitors", async () => {
    signInMocks.getUser.mockResolvedValue({ data: { user: null } });

    const element = await SignInPage();

    expect(element.props.mode).toBe("sign-in");
    expect(signInMocks.redirect).not.toHaveBeenCalled();
  });
});
