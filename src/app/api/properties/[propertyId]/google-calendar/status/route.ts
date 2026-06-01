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
    const connection = await new GoogleCalendarService(
      supabase
    ).getSafeConnection(ownerId, params.propertyId);

    return NextResponse.json({ ok: true, data: { connection } });
  } catch (error) {
    return jsonError(error);
  }
}
