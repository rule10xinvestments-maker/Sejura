import { NextResponse } from "next/server";
import { NotificationService } from "@/domain/notifications/service";
import { getCurrentOwnerId } from "@/lib/auth/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  try {
    const supabase = createSupabaseServerClient();
    const ownerId = await getCurrentOwnerId(supabase);
    const url = new URL(request.url);
    const notifications = await new NotificationService(
      supabase
    ).getOwnerNotifications(ownerId, {
      status: url.searchParams.get("status") as never,
      priority: url.searchParams.get("priority") as never,
      type: url.searchParams.get("type") as never,
      propertyId: url.searchParams.get("property_id") ?? undefined,
      unreadOnly: url.searchParams.get("unread_only") === "true"
    });

    return NextResponse.json({ ok: true, data: { notifications } });
  } catch {
    return NextResponse.json({ ok: false, error: "Notificarile nu pot fi incarcate." }, { status: 500 });
  }
}
