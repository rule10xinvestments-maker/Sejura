"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type AuthFormProps = {
  mode: "sign-in" | "sign-up";
};

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const isSignUp = mode === "sign-up";

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email"));
    const password = String(formData.get("password"));
    const confirmPassword = String(formData.get("confirm_password") ?? "");

    if (isSignUp && password !== confirmPassword) {
      setError("Parolele nu coincid.");
      return;
    }

    setLoading(true);

    const result = isSignUp
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password });

    setLoading(false);

    if (result.error) {
      setError(result.error.message);
      return;
    }

    router.push("/app");
    router.refresh();
  }

  async function continueWithGoogle() {
    setGoogleLoading(true);
    setError(null);

    const origin = window.location.origin;
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${origin}/auth/callback?next=/app`
      }
    });

    if (oauthError) {
      setError(oauthError.message);
      setGoogleLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-mist px-4 py-8">
      <section className="w-full max-w-md rounded-lg border border-line bg-white p-5 shadow-soft">
        <Link className="text-lg font-bold text-ink" href="/">
          Sejura
        </Link>
        <h1 className="mt-6 text-2xl font-bold">
          {isSignUp ? "Creeaz\u0103 cont" : "Intr\u0103 in cont"}
        </h1>
        <p className="mt-2 text-sm text-ink/65">
          Pentru proprietari de pensiuni, cabane si vile locale.
        </p>

        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          <div className="space-y-1">
            <label className="label" htmlFor={`${mode}-email`}>
              Email
            </label>
            <input
              autoComplete="email"
              className="field"
              id={`${mode}-email`}
              name="email"
              required
              type="email"
            />
          </div>

          <div className="space-y-1">
            <label className="label" htmlFor={`${mode}-password`}>
              {"Parol\u0103"}
            </label>
            <div className="relative">
              <input
                autoComplete={isSignUp ? "new-password" : "current-password"}
                className="field pr-24"
                id={`${mode}-password`}
                minLength={8}
                name="password"
                required
                type={showPassword ? "text" : "password"}
              />
              <button
                aria-label={
                  showPassword ? "Ascunde parola" : "Arat\u0103 parola"
                }
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md px-2 py-1 text-sm font-semibold text-moss"
                onClick={() => setShowPassword((current) => !current)}
                type="button"
              >
                {showPassword ? "Ascunde" : "Arat\u0103"}
              </button>
            </div>
          </div>

          {isSignUp ? (
            <div className="space-y-1">
              <label className="label" htmlFor="sign-up-confirm-password">
                {"Confirm\u0103 parola"}
              </label>
              <div className="relative">
                <input
                  autoComplete="new-password"
                  className="field pr-24"
                  id="sign-up-confirm-password"
                  minLength={8}
                  name="confirm_password"
                  required
                  type={showConfirmPassword ? "text" : "password"}
                />
                <button
                  aria-label={
                    showConfirmPassword
                      ? "Ascunde confirmarea parolei"
                      : "Arat\u0103 confirmarea parolei"
                  }
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md px-2 py-1 text-sm font-semibold text-moss"
                  onClick={() =>
                    setShowConfirmPassword((current) => !current)
                  }
                  type="button"
                >
                  {showConfirmPassword ? "Ascunde" : "Arat\u0103"}
                </button>
              </div>
            </div>
          ) : null}

          {error ? (
            <p aria-live="polite" className="text-sm text-red-700">
              {error}
            </p>
          ) : null}

          <button className="button-primary w-full" disabled={loading}>
            {loading
              ? "Se proceseaza..."
              : isSignUp
                ? "Creeaz\u0103 cont"
                : "Intr\u0103"}
          </button>
        </form>

        <div className="my-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-line" />
          <span className="text-xs font-semibold uppercase text-ink/50">sau</span>
          <div className="h-px flex-1 bg-line" />
        </div>

        <button
          className="button-secondary w-full"
          disabled={googleLoading}
          onClick={continueWithGoogle}
          type="button"
        >
          {googleLoading ? "Se deschide Google..." : "Continu\u0103 cu Google"}
        </button>

        <p className="mt-4 text-sm text-ink/70">
          {isSignUp ? "Ai deja cont?" : "Nu ai cont?"}{" "}
          <Link
            className="font-semibold text-moss"
            href={isSignUp ? "/sign-in" : "/sign-up"}
          >
            {isSignUp ? "Intr\u0103 in cont" : "Creeaz\u0103 unul"}
          </Link>
        </p>
      </section>
    </main>
  );
}
