import { NextResponse } from "next/server";
import { NotificationService } from "@/domain/notifications/service";
import { getCurrentOwnerId } from "@/lib/auth/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(
  _request: Request,
  { params }: { params: { notificationId: string } }
) {
  try {
    const supabase = createSupabaseServerClient();
    const ownerId = await getCurrentOwnerId(supabase);
    const notification = await new NotificationService(
      supabase
    ).resolveNotification(ownerId, params.notificationId);

    return NextResponse.json({ ok: true, data: { notification } });
  } catch {
    return NextResponse.json({ ok: false, error: "Notificarea nu a fost gasita." }, { status: 404 });
  }
}
