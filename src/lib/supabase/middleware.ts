import { type NextRequest, NextResponse } from "next/server";

const protectedPathPrefixes = ["/app", "/admin"];
const publicPathPrefixes = [
  "/",
  "/guest",
  "/p",
  "/sign-in",
  "/sign-up",
  "/auth/callback"
];

function isPathOrChild(pathname: string, prefix: string) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

function isProtectedPath(pathname: string) {
  return protectedPathPrefixes.some((prefix) => isPathOrChild(pathname, prefix));
}

function isPublicPath(pathname: string) {
  return publicPathPrefixes.some((prefix) =>
    prefix === "/" ? pathname === "/" : isPathOrChild(pathname, prefix)
  );
}

function hasSupabaseAuthCookie(request: NextRequest) {
  return request.cookies.getAll().some(({ name, value }) => {
    if (!value) return false;

    return (
      name.startsWith("sb-") &&
      (name.includes("auth-token") ||
        name.includes("access-token") ||
        name.includes("refresh-token"))
    );
  });
}

export function updateSession(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!isProtectedPath(pathname)) {
    return NextResponse.next({ request });
  }

  if (hasSupabaseAuthCookie(request)) {
    return NextResponse.next({ request });
  }

  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = "/sign-in";
  redirectUrl.searchParams.set("next", pathname);

  return NextResponse.redirect(redirectUrl);
}

export const middlewareInternals = {
  hasSupabaseAuthCookie,
  isProtectedPath,
  isPublicPath
};
