import { redirect } from "next/navigation";

type SupabaseAuthClient = {
  auth: {
    getUser: () => Promise<{ data: { user: { id: string } | null }; error?: unknown }>;
  };
};

export async function getCurrentOwnerId(supabase: SupabaseAuthClient) {
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  return user.id;
}
