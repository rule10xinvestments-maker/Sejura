import { redirect } from "next/navigation";
import { AppShell } from "@/components/app/app-shell";
import { NotificationService } from "@/domain/notifications/service";
import { ensureOwnerProfile } from "@/domain/owners/service";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function ProtectedLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const supabase = createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  await ensureOwnerProfile(supabase, user.id, user.email ?? null);
  const notificationCounts = await new NotificationService(
    supabase
  ).getNotificationCounts(user.id);

  return <AppShell notificationCounts={notificationCounts}>{children}</AppShell>;
}
