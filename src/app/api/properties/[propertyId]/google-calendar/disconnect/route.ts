import { NextResponse } from "next/server";
import { jsonError } from "@/domain/bookings/http";
import { GoogleCalendarService } from "@/domain/google-calendar/service";
import { getCurrentOwnerId } from "@/lib/auth/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(
  _request: Request,
  { params }: { params: { propertyId: string } }
) {
  try {
    const supabase = createSupabaseServerClient();
    const ownerId = await getCurrentOwnerId(supabase);
    await new GoogleCalendarService(supabase).disconnect(ownerId, params.propertyId);

    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
