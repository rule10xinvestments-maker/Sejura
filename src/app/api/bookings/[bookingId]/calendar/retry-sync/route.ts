import { NextResponse } from "next/server";
import { jsonError } from "@/domain/bookings/http";
import { GoogleCalendarService } from "@/domain/google-calendar/service";
import { NotificationService } from "@/domain/notifications/service";
import { getCurrentOwnerId } from "@/lib/auth/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(
  _request: Request,
  { params }: { params: { bookingId: string } }
) {
  try {
    const supabase = createSupabaseServerClient();
    const ownerId = await getCurrentOwnerId(supabase);
    let result;
    try {
      result = await new GoogleCalendarService(supabase).retryBookingSync(
        ownerId,
        params.bookingId
      );
    } catch (error) {
      await new NotificationService(supabase).notifyCalendarSyncFailed(
        params.bookingId
      );
      throw error;
    }

    return NextResponse.json({ ok: true, data: result });
  } catch (error) {
    return jsonError(error);
  }
}
