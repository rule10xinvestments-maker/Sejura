import Link from "next/link";
import { revalidatePath } from "next/cache";
import { NotificationService } from "@/domain/notifications/service";
import type { OwnerNotification } from "@/domain/notifications/types";
import { getCurrentOwnerId } from "@/lib/auth/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const priorityLabels: Record<OwnerNotification["priority"], string> = {
  critical: "Critic",
  important: "Important",
  info: "Informativ"
};

const statusLabels: Record<OwnerNotification["status"], string> = {
  queued: "Necitit",
  sent: "Necitit",
  failed: "Necitit",
  read: "Citit"
};

export default async function NotificationsPage() {
  const supabase = createSupabaseServerClient();
  const ownerId = await getCurrentOwnerId(supabase);
  const service = new NotificationService(supabase);
  const notifications = await service.getOwnerNotifications(ownerId);
  const sorted = [...notifications].sort((a, b) => {
    const priorityOrder = { critical: 0, important: 1, info: 2 };
    const aRead = a.status === "read" ? 1 : 0;
    const bRead = b.status === "read" ? 1 : 0;
    return (
      priorityOrder[a.priority] - priorityOrder[b.priority] ||
      aRead - bRead ||
      b.created_at.localeCompare(a.created_at)
    );
  });

  async function markRead(formData: FormData) {
    "use server";

    const serverSupabase = createSupabaseServerClient();
    const serverOwnerId = await getCurrentOwnerId(serverSupabase);
    await new NotificationService(serverSupabase).markAsRead(
      serverOwnerId,
      String(formData.get("notification_id"))
    );
    revalidatePath("/app/notifications");
  }

  async function resolve(formData: FormData) {
    "use server";

    const serverSupabase = createSupabaseServerClient();
    const serverOwnerId = await getCurrentOwnerId(serverSupabase);
    await new NotificationService(serverSupabase).resolveNotification(
      serverOwnerId,
      String(formData.get("notification_id"))
    );
    revalidatePath("/app/notifications");
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-semibold text-clay">Actiuni proprietar</p>
        <h1 className="text-2xl font-bold">Notificari</h1>
      </div>

      {sorted.length === 0 ? (
        <section className="panel">
          <p className="text-sm text-ink/70">Nu exista notificari.</p>
        </section>
      ) : (
        <section className="grid gap-3">
          {sorted.map((notification) => (
            <article className="panel" key={notification.id}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-md border border-line px-2 py-1 text-xs font-semibold">
                      {priorityLabels[notification.priority]}
                    </span>
                    <span className="rounded-md border border-line px-2 py-1 text-xs font-semibold">
                      {notification.resolved_at ? "Rezolvat" : statusLabels[notification.status]}
                    </span>
                  </div>
                  <h2 className="mt-3 text-lg font-semibold">{notification.title}</h2>
                  <p className="mt-2 whitespace-pre-line text-sm text-ink/75">
                    {notification.body}
                  </p>
                  <p className="mt-2 text-xs text-ink/50">{notification.created_at}</p>
                </div>
                <div className="flex flex-col gap-2">
                  {notification.action_url ? (
                    <Link className="button-primary" href={notification.action_url}>
                      {notification.action_label ?? "Deschide"}
                    </Link>
                  ) : null}
                  {notification.status !== "read" ? (
                    <form action={markRead}>
                      <input name="notification_id" type="hidden" value={notification.id} />
                      <button className="button-secondary w-full" type="submit">
                        Marcheaza ca citit
                      </button>
                    </form>
                  ) : null}
                  {!notification.resolved_at && notification.priority === "critical" ? (
                    <form action={resolve}>
                      <input name="notification_id" type="hidden" value={notification.id} />
                      <button className="button-secondary w-full" type="submit">
                        Rezolvat
                      </button>
                    </form>
                  ) : null}
                </div>
              </div>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}
