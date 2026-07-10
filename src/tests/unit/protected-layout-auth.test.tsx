import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ProtectedLayout from "@/app/(protected)/layout";
import { signOut } from "@/lib/auth/actions";

const authMocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  signOut: vi.fn(),
  redirect: vi.fn((path: string) => {
    throw new Error(`redirect:${path}`);
  }),
  ensureOwnerProfile: vi.fn(),
  getNotificationCounts: vi.fn()
}));

vi.mock("next/navigation", () => ({
  redirect: authMocks.redirect
}));

vi.mock("@/components/app/app-shell", () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="app-shell">{children}</div>
  )
}));

vi.mock("@/domain/owners/service", () => ({
  ensureOwnerProfile: authMocks.ensureOwnerProfile
}));

vi.mock("@/domain/notifications/service", () => ({
  NotificationService: vi.fn(() => ({
    getNotificationCounts: authMocks.getNotificationCounts
  }))
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(() => ({
    auth: {
      getUser: authMocks.getUser,
      signOut: authMocks.signOut
    }
  }))
}));

describe("protected owner auth", () => {
  beforeEach(() => {
    authMocks.getUser.mockReset();
    authMocks.signOut.mockReset();
    authMocks.redirect.mockClear();
    authMocks.ensureOwnerProfile.mockReset();
    authMocks.getNotificationCounts.mockReset();
  });

  it("allows an authenticated owner to access the app shell", async () => {
    authMocks.getUser.mockResolvedValue({
      data: { user: { id: "owner-1", email: "owner@sejura.test" } }
    });
    authMocks.getNotificationCounts.mockResolvedValue({
      unread: 0,
      unresolved: 0
    });

    const element = await ProtectedLayout({ children: <span>Dashboard</span> });

    expect(element.props.children.props.children).toBe("Dashboard");
    expect(authMocks.ensureOwnerProfile).toHaveBeenCalledWith(
      expect.anything(),
      "owner-1",
      "owner@sejura.test"
    );
    expect(authMocks.redirect).not.toHaveBeenCalled();
  });

  it("redirects unauthenticated users away from the owner app", async () => {
    authMocks.getUser.mockResolvedValue({ data: { user: null } });

    await expect(
      ProtectedLayout({ children: <span>Dashboard</span> })
    ).rejects.toThrow("redirect:/sign-in");
  });

  it("clears the Supabase session only through explicit logout", async () => {
    authMocks.signOut.mockResolvedValue({ error: null });

    await expect(signOut()).rejects.toThrow("redirect:/sign-in");

    expect(authMocks.signOut).toHaveBeenCalledTimes(1);
  });
});
