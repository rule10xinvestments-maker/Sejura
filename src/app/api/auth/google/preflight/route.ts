import { NextResponse } from "next/server";
import { resolveSupabasePublicEnv } from "@/lib/env";

function isSafeSupabaseOAuthUrl(rawUrl: unknown) {
  if (typeof rawUrl !== "string") return false;

  try {
    const candidate = new URL(rawUrl);
    const supabaseUrl = new URL(resolveSupabasePublicEnv().url);

    return (
      candidate.origin === supabaseUrl.origin &&
      candidate.pathname === "/auth/v1/authorize" &&
      candidate.searchParams.get("provider") === "google"
    );
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const url = typeof body === "object" && body && "url" in body ? body.url : null;

  if (!isSafeSupabaseOAuthUrl(url)) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  try {
    const response = await fetch(url as string, {
      method: "GET",
      redirect: "manual"
    });

    return NextResponse.json({
      ok: response.status >= 300 && response.status < 400
    });
  } catch {
    return NextResponse.json({ ok: false }, { status: 502 });
  }
}
