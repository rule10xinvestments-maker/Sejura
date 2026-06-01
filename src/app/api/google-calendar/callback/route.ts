import { NextResponse } from "next/server";
import { GoogleCalendarError } from "@/domain/google-calendar/errors";
import { GoogleCalendarService } from "@/domain/google-calendar/service";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const denied = url.searchParams.get("error");

  if (denied) {
    return NextResponse.redirect(
      new URL("/app/settings/google-calendar?status=denied", request.url)
    );
  }

  if (!code || !state) {
    return NextResponse.redirect(
      new URL("/app/settings/google-calendar?status=error", request.url)
    );
  }

  try {
    const supabase = createSupabaseServerClient();
    const redirectTarget = await new GoogleCalendarService(
      supabase
    ).handleOAuthCallback(code, state);

    return NextResponse.redirect(
      new URL(`${redirectTarget}?status=connected`, request.url)
    );
  } catch (error) {
    const status =
      error instanceof GoogleCalendarError &&
      error.code === "GOOGLE_OAUTH_STATE_INVALID"
        ? "invalid-state"
        : "error";

    return NextResponse.redirect(
      new URL(`/app/settings/google-calendar?status=${status}`, request.url)
    );
  }
}
