import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthForm } from "@/components/auth/auth-form";

const authMocks = vi.hoisted(() => ({
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
  createSupabaseBrowserClient: () => ({
    auth: authMocks
  })
}));

describe("AuthForm", () => {
  beforeEach(() => {
    authMocks.signInWithOAuth.mockReset();
    authMocks.signInWithPassword.mockReset();
    authMocks.signUp.mockReset();
    authMocks.signUp.mockResolvedValue({ error: null });
    authMocks.signInWithPassword.mockResolvedValue({ error: null });
    authMocks.signInWithOAuth.mockResolvedValue({ error: null });
  });

  it("renders Google login and no confirm password on sign-in", () => {
    render(<AuthForm mode="sign-in" />);

    expect(
      screen.getByRole("button", { name: "Continu\u0103 cu Google" })
    ).toBeVisible();
    expect(screen.getByRole("button", { name: "Intr\u0103" })).toBeVisible();
    expect(screen.getByLabelText("Parol\u0103")).toHaveAttribute(
      "autocomplete",
      "current-password"
    );
    expect(screen.queryByLabelText("Confirm\u0103 parola")).not.toBeInTheDocument();
  });

  it("renders confirm password and Google login on sign-up", () => {
    render(<AuthForm mode="sign-up" />);

    expect(screen.getByLabelText("Email")).toHaveAttribute("autocomplete", "email");
    expect(screen.getByLabelText("Parol\u0103")).toHaveAttribute(
      "autocomplete",
      "new-password"
    );
    expect(screen.getByLabelText("Confirm\u0103 parola")).toHaveAttribute(
      "autocomplete",
      "new-password"
    );
    expect(
      screen.getByRole("button", { name: "Continu\u0103 cu Google" })
    ).toBeVisible();
  });

  it("blocks sign-up when passwords do not match", () => {
    render(<AuthForm mode="sign-up" />);

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "gazda@example.com" }
    });
    fireEvent.change(screen.getByLabelText("Parol\u0103"), {
      target: { value: "parola-sejura" }
    });
    fireEvent.change(screen.getByLabelText("Confirm\u0103 parola"), {
      target: { value: "parola-diferita" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Creeaz\u0103 cont" }));

    expect(screen.getByText("Parolele nu coincid.")).toBeVisible();
    expect(authMocks.signUp).not.toHaveBeenCalled();
  });

  it("toggles password visibility without submitting", () => {
    render(<AuthForm mode="sign-up" />);

    const passwordInput = screen.getByLabelText("Parol\u0103");
    const confirmInput = screen.getByLabelText("Confirm\u0103 parola");

    expect(passwordInput).toHaveAttribute("type", "password");
    expect(confirmInput).toHaveAttribute("type", "password");

    fireEvent.click(screen.getByRole("button", { name: "Arat\u0103 parola" }));
    fireEvent.click(
      screen.getByRole("button", { name: "Arat\u0103 confirmarea parolei" })
    );

    expect(passwordInput).toHaveAttribute("type", "text");
    expect(confirmInput).toHaveAttribute("type", "text");
    expect(authMocks.signUp).not.toHaveBeenCalled();
  });
});
