"use server";

import { apiRequest, type ApiErrorResponse } from "@/lib/api";
import { isApiConfigured } from "@/lib/env";

/**
 * Admin’deki domain modülleri + server action kalıbına uygun genel sarmalayıcı.
 * Gerçek endpoint’ler için `lib/api/<alan>.ts` içinde `apiRequest` kullanın (admin ile aynı).
 */
export async function serverFetchJson<T>(
  path: string,
  options: {
    method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
    body?: unknown;
    skipAuthRedirect?: boolean;
  } = {},
): Promise<
  | {
      ok: true;
      status: number;
      data: T;
    }
  | {
      ok: false;
      status: number;
      message: string;
      apiError?: ApiErrorResponse;
      reason?: "not_configured";
    }
> {
  if (!isApiConfigured()) {
    return {
      ok: false,
      status: 0,
      message: "API_BASE_URL veya API_CLIENT_KEY tanımlı değil (.env.local)",
      reason: "not_configured",
    };
  }

  const result = await apiRequest<T>(path, {
    method: options.method ?? "GET",
    body: options.body,
    skipAuthRedirect: options.skipAuthRedirect ?? true,
  });

  if (result.error) {
    const msg = result.error.message;
    const message = Array.isArray(msg) ? msg.join(", ") : String(msg);
    return {
      ok: false,
      status: result.status,
      message,
      apiError: result.error,
    };
  }

  return {
    ok: true,
    status: result.status,
    data: result.data,
  };
}
