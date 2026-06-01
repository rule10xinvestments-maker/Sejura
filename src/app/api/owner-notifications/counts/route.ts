import { NextResponse } from "next/server";
import { NotificationService } from "@/domain/notifications/service";
import { getCurrentOwnerId } from "@/lib/auth/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = createSupabaseServerClient();
  const ownerId = await getCurrentOwnerId(supabase);
  const counts = await new NotificationService(supabase).getNotificationCounts(ownerId);

  return NextResponse.json({ ok: true, data: counts });
}
