import { redirect } from "next/navigation";
import type { AppSupabaseClient } from "@/lib/supabase/types";

type SupabaseAuthClient = {
  auth: {
    getUser: () => Promise<{ data: { user: { id: string } | null }; error?: unknown }>;
  };
};

export async function getCurrentOwnerId(
  supabase: SupabaseAuthClient & Pick<AppSupabaseClient, "from">
) {
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  const { data: owner } = await supabase
    .from("owners")
    .select("account_status")
    .eq("id", user.id)
    .maybeSingle();

  if (
    owner?.account_status === "suspended" ||
    owner?.account_status === "disabled" ||
    owner?.account_status === "deletion_requested"
  ) {
    redirect("/account-suspended");
  }

  return user.id;
}
