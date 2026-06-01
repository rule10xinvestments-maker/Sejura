import { NextResponse } from "next/server";
import { z } from "zod";
import { jsonError } from "@/domain/bookings/http";
import { GoogleCalendarService } from "@/domain/google-calendar/service";
import { getCurrentOwnerId } from "@/lib/auth/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const schema = z.object({ calendarId: z.string().min(1) });

export async function POST(
  request: Request,
  { params }: { params: { propertyId: string } }
) {
  try {
    const supabase = createSupabaseServerClient();
    const ownerId = await getCurrentOwnerId(supabase);
    const { calendarId } = schema.parse(await request.json());
    const connection = await new GoogleCalendarService(
      supabase
    ).setSelectedCalendar(ownerId, params.propertyId, calendarId);

    return NextResponse.json({ ok: true, data: { connection } });
  } catch (error) {
    return jsonError(error);
  }
}
