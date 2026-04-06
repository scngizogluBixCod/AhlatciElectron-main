"use server";

import { apiRequest } from "@/lib/api";
import type { AuthResponseDto } from "@/lib/auth-types";
import {
  clearTempToken,
  getTempToken,
  setAuthCookies,
} from "@/lib/auth-cookies";

const LOGIN_SUCCESS_MESSAGE = "Giriş başarılı.";
const ADMIN_PANEL_ACCESS_DENIED_MESSAGE =
  "Admin paneline erişiminiz bulunmuyor.";

export type VerifyOtpResult =
  | { success: false; error: string }
  | {
      success: true;
      refreshToken: string;
      redirectTo: string;
      successMessage: string;
    };

export async function verifyLoginOtpAction(
  _prev: VerifyOtpResult | null,
  formData: FormData,
): Promise<VerifyOtpResult> {
  const code = (formData.get("code") as string)?.trim();
  const tempToken = await getTempToken();

  if (!tempToken || !code) {
    return {
      success: false,
      error: "Doğrulama kodu ve geçici token gereklidir.",
    };
  }

  const result = await apiRequest<AuthResponseDto>("auth/login/verify-otp", {
    method: "POST",
    body: { tempToken, code },
    skipAutoRefresh: true,
  });

  const { data, status, error: apiError } = result;

  const unwrap = (d: typeof data) =>
    d &&
    "data" in d &&
    typeof (d as { data?: AuthResponseDto }).data === "object"
      ? (d as { data: AuthResponseDto }).data
      : d;

  const auth = status === 200 ? (unwrap(data) as AuthResponseDto) : null;
  if (auth?.canAccessAdminPanel === false) {
    return { success: false, error: ADMIN_PANEL_ACCESS_DENIED_MESSAGE };
  }
  if (auth?.accessToken && auth?.refreshToken) {
    const roleName = auth?.user?.role?.name ?? "";
    await setAuthCookies(auth.accessToken, roleName);
    await clearTempToken();
    const redirectTo =
      roleName === "AGENT"
        ? "/agent"
        : roleName === "CASHIER"
          ? "/cashier"
          : "/";
    return {
      success: true,
      refreshToken: auth.refreshToken,
      redirectTo,
      successMessage: LOGIN_SUCCESS_MESSAGE,
    };
  }

  return {
    success: false,
    error: Array.isArray(apiError?.message)
      ? apiError?.message[0]
      : apiError?.message || "Doğrulama başarısız.",
  };
}
