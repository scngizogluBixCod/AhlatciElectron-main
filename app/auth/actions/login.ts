"use server";

import { redirect, unstable_rethrow } from "next/navigation";
import { apiRequest } from "@/lib/api";
import type { AuthOtpPendingDto, AuthResponseDto } from "@/lib/auth-types";
import { setAuthCookies, setTempTokenCookie } from "@/lib/auth-cookies";

const LOGIN_SUCCESS_MESSAGE = "Giriş başarılı.";
const ADMIN_PANEL_ACCESS_DENIED_MESSAGE =
  "Admin paneline erişiminiz bulunmuyor.";

/** Middleware ile uyumlu: sadece güvenli relative path'lere redirect. */
function isSafeRedirectPath(path: string): boolean {
  return (
    typeof path === "string" &&
    path.startsWith("/") &&
    !path.startsWith("//") &&
    !path.includes("://") &&
    !path.includes("\\")
  );
}

export type LoginResult =
  | { success: false; error: string }
  | {
      success: true;
      refreshToken: string;
      redirectTo: string;
      successMessage: string;
    };

async function loginActionImpl(
  _prev: LoginResult | null,
  formData: FormData,
): Promise<LoginResult> {
  const rawEmail = (formData.get("email") as string)?.trim() ?? "";
  const email = rawEmail.toLowerCase();
  const password = formData.get("password") as string;
  const from = (formData.get("from") as string)?.trim() || "";

  if (!email || !password) {
    return { success: false, error: "E-posta ve şifre gereklidir." };
  }

  let data: AuthResponseDto | AuthOtpPendingDto;
  let status: number;

  let result: {
    data: AuthResponseDto | AuthOtpPendingDto;
    status: number;
    error?: { message: string | string[] };
  };

  try {
    result = (await apiRequest<AuthResponseDto | AuthOtpPendingDto>(
      "auth/login",
      {
        method: "POST",
        body: { email, password },
        skipAutoRefresh: true,
      },
    )) as {
      data: AuthResponseDto | AuthOtpPendingDto;
      status: number;
      error?: { message: string | string[] };
    };
    data = result.data;
    status = result.status;
  } catch (err) {
    console.error("[Login] API isteği başarısız (catch)", err);
    return { success: false, error: "Bağlantı hatası. Lütfen tekrar deneyin." };
  }

  const apiMessage = Array.isArray(result.error?.message)
    ? result.error?.message[0]
    : result.error?.message;

  const unwrap = (d: typeof data) =>
    d &&
    "data" in d &&
    typeof (d as { data?: AuthResponseDto }).data === "object"
      ? (d as { data: AuthResponseDto }).data
      : d;

  if (status === 200 || status === 201) {
    const auth = unwrap(data) as AuthResponseDto;
    if (auth?.canAccessAdminPanel === false) {
      return { success: false, error: ADMIN_PANEL_ACCESS_DENIED_MESSAGE };
    }

    if (auth?.accessToken && auth?.refreshToken) {
      const roleName = auth?.user?.role?.name ?? "";
      await setAuthCookies(auth.accessToken, roleName);
      const redirectTo =
        roleName === "AGENT"
          ? "/agent"
          : roleName === "CASHIER"
            ? "/cashier"
            : from && isSafeRedirectPath(from)
              ? from
              : "/";
      return {
        success: true,
        refreshToken: auth.refreshToken,
        redirectTo,
        successMessage: LOGIN_SUCCESS_MESSAGE,
      };
    }
  }

  if (status === 202) {
    const otpPending = unwrap(data) as AuthOtpPendingDto;
    if (otpPending?.canAccessAdminPanel === false) {
      return { success: false, error: ADMIN_PANEL_ACCESS_DENIED_MESSAGE };
    }
    const tempToken =
      otpPending?.tempToken ?? (data as AuthOtpPendingDto)?.tempToken;
    if (tempToken) {
      await setTempTokenCookie(tempToken);
      const successMessage =
        otpPending?.message ?? "Doğrulama kodu gönderildi.";
      redirect(`/auth/otp?success=${encodeURIComponent(successMessage)}`);
    }
  }

  return { success: false, error: apiMessage || "Giriş başarısız." };
}

export async function loginAction(
  prev: LoginResult | null,
  formData: FormData,
): Promise<LoginResult> {
  try {
    return await loginActionImpl(prev, formData);
  } catch (err) {
    unstable_rethrow(err);
    console.error("[Login] Beklenmeyen hata", err);
    return {
      success: false,
      error: "Sunucu hatası. Lütfen tekrar deneyin.",
    };
  }
}
