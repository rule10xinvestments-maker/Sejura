import { NextResponse } from "next/server";
import { z } from "zod";
import { NotificationService } from "@/domain/notifications/service";
import { getCurrentOwnerId } from "@/lib/auth/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const schema = z.object({ notificationIds: z.array(z.string().uuid()) });

export async function POST(request: Request) {
  try {
    const supabase = createSupabaseServerClient();
    const ownerId = await getCurrentOwnerId(supabase);
    const { notificationIds } = schema.parse(await request.json());
    const notifications = await new NotificationService(supabase).markManyAsRead(
      ownerId,
      notificationIds
    );

    return NextResponse.json({ ok: true, data: { notifications } });
  } catch {
    return NextResponse.json({ ok: false, error: "Notificarile nu au putut fi actualizate." }, { status: 400 });
  }
}
