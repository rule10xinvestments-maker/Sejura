import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AuthForm } from "@/components/auth/auth-form";
import { EnvConfigError } from "@/lib/env";

const authMocks = vi.hoisted(() => ({
  createSupabaseBrowserClient: vi.fn(),
  signInWithOAuth: vi.fn(),
  signInWithPassword: vi.fn(),
  signUp: vi.fn()
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn()
  })
}));

vi.mock("@/lib/supabase/client", () => ({
  createSupabaseBrowserClient: authMocks.createSupabaseBrowserClient
}));

describe("AuthForm", () => {
  const originalGoogleAuthEnabled = process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED;

  beforeEach(() => {
    process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED = "false";
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ ok: false })
      })
    );
    authMocks.createSupabaseBrowserClient.mockReset();
    authMocks.signInWithOAuth.mockReset();
    authMocks.signInWithPassword.mockReset();
    authMocks.signUp.mockReset();
    authMocks.createSupabaseBrowserClient.mockReturnValue({
      auth: authMocks
    });
    authMocks.signUp.mockResolvedValue({ error: null });
    authMocks.signInWithPassword.mockResolvedValue({ error: null });
    authMocks.signInWithOAuth.mockResolvedValue({
      data: {
        url: "https://example.supabase.co/auth/v1/authorize?provider=google"
      },
      error: null
    });
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED = originalGoogleAuthEnabled;
    vi.unstubAllGlobals();
  });

  it("renders email login and no confirm password on sign-in", () => {
    render(<AuthForm mode="sign-in" />);

    expect(
      screen.getByText(
        "Autentificarea cu Google nu este activă încă. Folosește emailul și parola pentru contul Sejura."
      )
    ).toBeVisible();
    expect(
      screen.queryByRole("button", { name: "Continuă cu Google" })
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Intră" })).toBeVisible();
    expect(screen.getByLabelText("Parolă")).toHaveAttribute(
      "autocomplete",
      "current-password"
    );
    expect(screen.queryByLabelText("Confirmă parola")).not.toBeInTheDocument();
  });

  it("renders confirm password and keeps Google hidden until configured on sign-up", () => {
    render(<AuthForm mode="sign-up" />);

    expect(screen.getByLabelText("Email")).toHaveAttribute("autocomplete", "email");
    expect(screen.getByLabelText("Parolă")).toHaveAttribute(
      "autocomplete",
      "new-password"
    );
    expect(screen.getByLabelText("Confirmă parola")).toHaveAttribute(
      "autocomplete",
      "new-password"
    );
    expect(
      screen.queryByRole("button", { name: "Continuă cu Google" })
    ).not.toBeInTheDocument();
  });

  it("shows Google login when configured and starts Supabase OAuth", async () => {
    process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED = "true";
    const origin = window.location.origin;

    render(<AuthForm mode="sign-in" />);

    fireEvent.click(screen.getByRole("button", { name: "Continuă cu Google" }));

    await waitFor(() => {
      expect(authMocks.signInWithOAuth).toHaveBeenCalledWith({
        provider: "google",
        options: {
          redirectTo: `${origin}/auth/callback?next=/app`,
          skipBrowserRedirect: true
        }
      });
      expect(fetch).toHaveBeenCalledWith("/api/auth/google/preflight", {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({
          url: "https://example.supabase.co/auth/v1/authorize?provider=google"
        })
      });
    });
    expect(
      screen.queryByText("Unsupported provider: provider is not enabled")
    ).not.toBeInTheDocument();

  });

  it("maps Google OAuth startup errors to Romanian copy", async () => {
    process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED = "true";
    authMocks.signInWithOAuth.mockResolvedValue({
      data: { url: null },
      error: { message: "Unsupported provider: provider is not enabled" }
    });

    render(<AuthForm mode="sign-in" />);
    fireEvent.click(screen.getByRole("button", { name: "Continuă cu Google" }));

    expect(
      await screen.findByText(
        "Autentificarea cu Google nu este configurată complet. Contactează echipa Sejura sau folosește emailul și parola."
      )
    ).toBeVisible();
    expect(
      screen.queryByText("Unsupported provider: provider is not enabled")
    ).not.toBeInTheDocument();
  });

  it("blocks sign-up when passwords do not match", () => {
    render(<AuthForm mode="sign-up" />);

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "gazda@example.com" }
    });
    fireEvent.change(screen.getByLabelText("Parolă"), {
      target: { value: "parola-sejura" }
    });
    fireEvent.change(screen.getByLabelText("Confirmă parola"), {
      target: { value: "parola-diferita" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Creează cont" }));

    expect(screen.getByText("Parolele nu coincid.")).toBeVisible();
    expect(authMocks.signUp).not.toHaveBeenCalled();
  });

  it("shows missing Supabase env names instead of crashing the page", () => {
    const secretLikeValue = "secret-value-that-must-not-appear";
    authMocks.createSupabaseBrowserClient.mockImplementation(() => {
      throw new EnvConfigError(
        "Missing required environment variable(s): NEXT_PUBLIC_SUPABASE_URL",
        ["NEXT_PUBLIC_SUPABASE_URL"]
      );
    });

    render(<AuthForm mode="sign-in" />);

    expect(screen.getByText("Autentificarea nu este configurata.")).toBeVisible();
    expect(screen.getByText("NEXT_PUBLIC_SUPABASE_URL")).toBeVisible();
    expect(screen.getByRole("button", { name: "Intră" })).toBeDisabled();
    expect(screen.queryByText(secretLikeValue)).not.toBeInTheDocument();
  });

  it("toggles password visibility without submitting", () => {
    render(<AuthForm mode="sign-up" />);

    const passwordInput = screen.getByLabelText("Parolă");
    const confirmInput = screen.getByLabelText("Confirmă parola");

    expect(passwordInput).toHaveAttribute("type", "password");
    expect(confirmInput).toHaveAttribute("type", "password");

    fireEvent.click(screen.getByRole("button", { name: "Arată parola" }));
    fireEvent.click(
      screen.getByRole("button", { name: "Arată confirmarea parolei" })
    );

    expect(passwordInput).toHaveAttribute("type", "text");
    expect(confirmInput).toHaveAttribute("type", "text");
    expect(authMocks.signUp).not.toHaveBeenCalled();
  });
});
