import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

const publicPaths = new Set([
  "/",
  "/cazare",
  "/guest",
  "/sign-in",
  "/sign-up",
  "/manifest.webmanifest"
]);

export async function middleware(request: NextRequest) {
  if (
    publicPaths.has(request.nextUrl.pathname) ||
    request.nextUrl.pathname.startsWith("/p/")
  ) {
    return NextResponse.next();
  }

  return updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|webmanifest)$).*)"
  ]
};
