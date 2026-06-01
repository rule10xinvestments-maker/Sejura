import { NextResponse } from "next/server";
import { jsonError } from "@/domain/bookings/http";
import { GoogleCalendarService } from "@/domain/google-calendar/service";
import { getCurrentOwnerId } from "@/lib/auth/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(
  _request: Request,
  { params }: { params: { propertyId: string } }
) {
  try {
    const supabase = createSupabaseServerClient();
    const ownerId = await getCurrentOwnerId(supabase);
    const calendars = await new GoogleCalendarService(supabase).listCalendars(
      ownerId,
      params.propertyId
    );

    return NextResponse.json({ ok: true, data: { calendars } });
  } catch (error) {
    return jsonError(error);
  }
}
