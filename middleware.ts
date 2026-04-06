import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { AUTH_ACCESS_TOKEN } from "@/lib/auth-constants";

/** Oturum gerektirmeyen yollar (API, auth akışı, Next iç dosyaları). */
function isPublicPath(pathname: string): boolean {
  if (pathname.startsWith("/_next")) return true;
  if (pathname.startsWith("/api/")) return true;
  if (pathname.startsWith("/auth/")) return true;
  return false;
}

/** `public/` kökündeki statik dosyalar (uzantılı istekler). */
function looksLikePublicAsset(pathname: string): boolean {
  return /\.[a-zA-Z0-9]+$/.test(pathname);
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(AUTH_ACCESS_TOKEN)?.value;

  if (pathname === "/auth/login" && token) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (isPublicPath(pathname) || looksLikePublicAsset(pathname)) {
    return NextResponse.next();
  }

  if (!token) {
    const login = new URL("/auth/login", request.url);
    login.searchParams.set("from", pathname + request.nextUrl.search);
    return NextResponse.redirect(login);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
