import { NextResponse } from "next/server";
import { GoogleCalendarService } from "@/domain/google-calendar/service";
import { getCurrentOwnerId } from "@/lib/auth/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const propertyId = url.searchParams.get("property_id");
  const next = url.searchParams.get("next") ?? "/app/settings/google-calendar";

  if (!propertyId) {
    return NextResponse.redirect(
      new URL("/app/settings/google-calendar?status=error", request.url)
    );
  }

  try {
    const supabase = createSupabaseServerClient();
    const ownerId = await getCurrentOwnerId(supabase);
    const oauthUrl = await new GoogleCalendarService(supabase).buildOAuthUrl(
      ownerId,
      propertyId,
      next
    );

    return NextResponse.redirect(oauthUrl);
  } catch {
    return NextResponse.redirect(
      new URL("/app/settings/google-calendar?status=error", request.url)
    );
  }
}
