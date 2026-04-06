import { NextResponse } from "next/server";
import { clearAuthCookies } from "@/lib/auth-cookies";

export async function GET(request: Request) {
  await clearAuthCookies();
  return NextResponse.redirect(
    new URL("/auth/login", new URL(request.url).origin),
  );
}

export async function POST() {
  await clearAuthCookies();
  return NextResponse.json({ success: true, redirectTo: "/auth/login" });
}
