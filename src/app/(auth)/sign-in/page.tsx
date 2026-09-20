import React from "react";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth/auth-form";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function SignInPage({
  searchParams
}: {
  searchParams?: { error?: string; next?: string };
}) {
  let authConnectionFailed = false;
  let hasUser = false;

  try {
    const supabase = createSupabaseServerClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();
    hasUser = Boolean(user);
  } catch (error) {
    authConnectionFailed = true;
    console.error("[sign-in] failed to refresh auth session", error);
  }

  if (hasUser) {
    redirect("/app");
  }

  return (
    <AuthForm
      initialError={
        authConnectionFailed
          ? "Aplicația nu se poate conecta momentan. Reîncearcă."
          : null
      }
      mode="sign-in"
      routeError={searchParams?.error ?? null}
    />
  );
}
