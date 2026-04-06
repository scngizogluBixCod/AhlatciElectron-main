import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { AUTH_ACCESS_TOKEN } from "@/lib/auth-cookies";
import { extractAccessRefreshPair } from "@/lib/auth-tokens";
import { getBaseUrl, getApiKey } from "@/lib/env";
import { getAppLang } from "@/lib/i18n";

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

const DEFAULT_TIMEOUT_MS = 30_000;

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, message: "Invalid JSON" },
      { status: 400 },
    );
  }

  const refreshToken =
    typeof body === "object" &&
    body !== null &&
    "refreshToken" in body &&
    typeof (body as { refreshToken: unknown }).refreshToken === "string"
      ? (body as { refreshToken: string }).refreshToken
      : undefined;

  if (!refreshToken) {
    return NextResponse.json(
      { success: false, message: "refreshToken required" },
      { status: 400 },
    );
  }

  const baseUrl = getBaseUrl();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(`${baseUrl}/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": getApiKey(),
        "Accept-Language": await getAppLang(),
      },
      body: JSON.stringify({ refreshToken }),
      signal: controller.signal,
    });
  } catch {
    clearTimeout(timeoutId);
    return NextResponse.json(
      { success: false, message: "Network error" },
      { status: 502 },
    );
  } finally {
    clearTimeout(timeoutId);
  }

  if (!res.ok) {
    return NextResponse.json(
      { success: false, message: "Refresh failed" },
      { status: 401 },
    );
  }

  let parsed: unknown;
  const contentType = res.headers.get("content-type");
  if (contentType?.includes("application/json")) {
    try {
      parsed = await res.json();
    } catch {
      return NextResponse.json(
        { success: false, message: "Invalid response" },
        { status: 502 },
      );
    }
  } else {
    return NextResponse.json(
      { success: false, message: "Invalid response" },
      { status: 502 },
    );
  }

  const tokens = extractAccessRefreshPair(parsed);
  if (!tokens) {
    return NextResponse.json(
      { success: false, message: "Invalid tokens" },
      { status: 502 },
    );
  }

  const store = await cookies();
  store.set(AUTH_ACCESS_TOKEN, tokens.accessToken, cookieOptions);

  return NextResponse.json({
    success: true,
    refreshToken: tokens.refreshToken,
  });
}
