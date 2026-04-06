/**
 * Server-side API client (admin projesi ile aynı sözleşme).
 *
 * Token yenileme iki katmanda yapılır:
 *
 * 1. MIDDLEWARE (proaktif): Sayfa render'ından önce JWT exp kontrolü yapılır.
 *    Süresi dolmuşsa istemci tarafı /auth/session-refresh ile yenilenir (refresh localStorage'da).
 *
 * 2. API CLIENT (reaktif fallback): Refresh token sunucuda yok; otomatik yenileme yapılmaz.
 *    401 durumunda /auth/sign-out (localStorage temizleme) veya session-refresh akışı.
 *
 * Aynı anda birden fazla unauthorized yanıt için tek refresh yapılır (lock).
 */

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  getAccessToken,
  REFRESHED_ACCESS_TOKEN_HEADER,
} from "@/lib/auth-cookies";
import { getBaseUrl, getApiKey, getProxySecret } from "@/lib/env";
import { getAppLang } from "@/lib/i18n";

/** API isteklerini anlık loglamak için (dev veya API_REQUEST_LOG=true) */
const API_LOG_ENABLED =
  process.env.NODE_ENV === "development" ||
  process.env.API_REQUEST_LOG === "true";

function logRequest(
  method: string,
  path: string,
  status: number,
  durationMs: number,
) {
  if (!API_LOG_ENABLED) return;
  const statusStr = status >= 400 ? `\x1b[31m${status}\x1b[0m` : String(status);
  const duration =
    durationMs >= 1000
      ? `${(durationMs / 1000).toFixed(1)}s`
      : `${durationMs}ms`;
  console.log(`[API] ${method} ${path} ${statusStr} ${duration}`);
}

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

/**
 * Alan bazlı validasyon hataları.
 * Backend'e göre farklı formatlar olabilir:
 * - NestJS: { property: "name", message: "..." }[] veya message: string[]
 * - Laravel benzeri: { errors: { name: ["required"], email: ["invalid"] } }
 */
export type ApiValidationErrorItem = {
  property?: string;
  field?: string;
  message?: string;
  constraints?: Record<string, string>;
};

/** Backend details.errors formatı (örn. { field: "categoryId", messages: ["..."] }) */
export type ApiErrorDetailItem = {
  field?: string;
  messages?: string[];
};

/** API'den dönen standart hata yapısı */
export type ApiErrorResponse = {
  success: false;
  errorCode?: string;
  /** Tek mesaj veya NestJS tarzı mesaj dizisi */
  message: string | string[];
  timestamp?: string;
  path?: string;
  stack?: string;
  originalError?: string;
  /** Alan bazlı hatalar (backend destekliyorsa) */
  errors?: Record<string, string[]> | ApiValidationErrorItem[];
  /** Doğrulama detayları (örn. details.errors: [{ field, messages }]) */
  details?: { errors?: ApiErrorDetailItem[] };
};

export type ApiResult<T> = {
  data: T;
  status: number;
  /** Body'de success: false varsa dolu gelir */
  error?: ApiErrorResponse;
};

export type ApiRequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  headers?: Record<string, string>;
  /** JWT access token. Verilmezse cookie'den okunur. */
  accessToken?: string | null;
  /** true ise Unauthorized durumunda refresh denenmez (örn. login isteği). */
  skipAutoRefresh?: boolean;
  /**
   * true ise refresh başarısız olduğunda redirect yerine 401 döner.
   * Route Handler içinden çağrıda (örn. /api/reports/*) HTML login sayfasına düşmeyi önler.
   */
  skipAuthRedirect?: boolean;
  /** İstek timeout süresi (ms). Varsayılan: 30000 (30 saniye) */
  timeout?: number;
  /** fetch cache (Next.js). no-store = her seferinde taze veri */
  cache?: RequestCache;
};

const DEFAULT_TIMEOUT_MS = 30_000;

/**
 * Mevcut istek için kullanılacak access token.
 * Middleware refresh yaptıysa x-refreshed-access-token header'ında gelir;
 * yoksa cookie'den okunur.
 */
async function getAccessTokenForRequest(): Promise<string | undefined> {
  const h = await headers();
  const refreshed = h.get(REFRESHED_ACCESS_TOKEN_HEADER);
  if (refreshed) return refreshed;
  return getAccessToken();
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

/** Body'nin { success: false, message?: ... } yapısında olup olmadığını kontrol eder */
export function isApiErrorBody(body: unknown): body is ApiErrorResponse {
  if (typeof body !== "object" || body === null || !("success" in body))
    return false;
  const b = body as ApiErrorResponse;
  if (b.success !== false) return false;
  return true;
}

/**
 * Response'un "Unauthorized" (token süresi dolmuş) hatası olup olmadığını kontrol eder.
 * Backend bazen HTTP 401, bazen başka status ile dönebilir. Bu yüzden hem
 * HTTP status'a hem de response body'sine bakıyoruz.
 */
function isUnauthorizedError(
  httpStatus: number,
  error?: ApiErrorResponse,
): boolean {
  // HTTP 401 → kesin unauthorized
  if (httpStatus === 401) return true;
  // Body'de Unauthorized mesajı var mı
  if (!error) return false;
  const msg = error.message;
  const msgStr = Array.isArray(msg) ? msg.join(" ") : msg;
  return msgStr === "Unauthorized" || error.originalError === "Unauthorized";
}

/* ------------------------------------------------------------------ */
/*  Refresh Token (sunucuda yok; refresh localStorage'da)               */
/* ------------------------------------------------------------------ */

/** Paralel unauthorized yanıtlarda tek refresh yapılması için lock */
let refreshPromise: Promise<string | null> | null = null;

/**
 * Sunucu bileşenleri refresh token okuyamaz; otomatik yenileme yapılmaz.
 * İstemci /auth/session-refresh veya /api/auth/refresh kullanır.
 */
async function refreshAccessToken(): Promise<string | null> {
  return null;
}

/* ------------------------------------------------------------------ */
/*  Request Deduplication (aynı path + token için tek istek)           */
/* ------------------------------------------------------------------ */

const inFlightRequests = new Map<string, Promise<ApiResult<unknown>>>();

function getDedupKey(
  path: string,
  method: string,
  token: string | undefined,
  body: unknown,
  skipAuthRedirect?: boolean,
): string {
  const bodyPart = method !== "GET" && body != null ? JSON.stringify(body) : "";
  const tokenPart = (token ?? "").slice(0, 40);
  const redirectPart = skipAuthRedirect ? ":noRedirect" : "";
  return `${method}:${path}:${tokenPart}:${bodyPart}${redirectPart}`;
}

/* ------------------------------------------------------------------ */
/*  Execute Request (internal)                                        */
/* ------------------------------------------------------------------ */

async function executeRequest<T>(
  path: string,
  options: ApiRequestOptions,
): Promise<{
  res: Response;
  data: T | undefined;
  error: ApiErrorResponse | undefined;
}> {
  const start = Date.now();
  const {
    method = "GET",
    body,
    headers: optHeaders = {},
    accessToken: tokenOption,
  } = options;
  const baseUrl = getBaseUrl();
  const targetPath = path.startsWith("/") ? path : `/${path}`;
  const url = `${baseUrl}?path=${encodeURIComponent(targetPath)}`;
  const accessToken = tokenOption ?? (await getAccessTokenForRequest());

  const isAuthRequest = path.includes("/auth/") || path.startsWith("auth/");

  const reqHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    "X-API-Key": getApiKey(),
    "X-Proxy-Secret": getProxySecret(),
    "Accept-Language": await getAppLang(),
    ...optHeaders,
  };
  if (accessToken) {
    reqHeaders.Authorization = `Bearer ${accessToken}`;
  }

  const controller = new AbortController();
  const timeoutMs = options.timeout ?? DEFAULT_TIMEOUT_MS;
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  let res: Response;
  try {
    res = await fetch(url, {
      method,
      headers: reqHeaders,
      signal: controller.signal,
      cache: options.cache ?? "no-store",
      ...(body !== undefined &&
        body !== null && { body: JSON.stringify(body) }),
    });
  } catch (err) {
    if (isAuthRequest) {
      console.error("[API] Fetch hatası", { path, url, cause: err });
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }

  let data: T | undefined;
  let error: ApiErrorResponse | undefined;
  const contentType = res.headers.get("content-type");

  if (contentType?.includes("application/json")) {
    try {
      const parsed = (await res.json()) as T | ApiErrorResponse;
      if (isApiErrorBody(parsed)) {
        error = parsed;
      } else {
        data = parsed as T;
      }
    } catch {
      // body okunamadı
    }
  }

  logRequest(method, path, res.status, Date.now() - start);
  return { res, data, error };
}

/* ------------------------------------------------------------------ */
/*  Public: apiRequest                                                */
/* ------------------------------------------------------------------ */

/**
 * Gerçek istek mantığı (refresh, retry dahil).
 */
async function apiRequestInner<T>(
  path: string,
  options: ApiRequestOptions,
): Promise<ApiResult<T>> {
  const first = await executeRequest<T>(path, options);

  const unauthorized = isUnauthorizedError(first.res.status, first.error);

  if (!unauthorized || options.skipAutoRefresh) {
    return {
      data: first.data as T,
      status: first.res.status,
      error: first.error,
    };
  }

  if (!refreshPromise) {
    refreshPromise = refreshAccessToken().finally(() => {
      refreshPromise = null;
    });
  }
  const newAccessToken = await refreshPromise;

  if (!newAccessToken) {
    if (options.skipAuthRedirect) {
      return {
        data: undefined as T,
        status: 401,
        error: {
          success: false,
          message: "Unauthorized",
        },
      };
    }
    redirect("/auth/sign-out");
  }

  const retry = await executeRequest<T>(path, {
    ...options,
    accessToken: newAccessToken,
  });

  return {
    data: retry.data as T,
    status: retry.res.status,
    error: retry.error,
  };
}

/**
 * Server tarafında API isteği atar.
 *
 * - Aynı path + token için eşzamanlı çağrılar tek HTTP isteğiyle sonuçlanır (rate-limit koruması).
 * - Token yenileme ve retry mantığı: @see apiRequestInner
 */
export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<ApiResult<T>> {
  const token = options.accessToken ?? (await getAccessTokenForRequest());
  const method = options.method ?? "GET";
  const dedupKey = getDedupKey(
    path,
    method,
    token,
    options.body,
    options.skipAuthRedirect,
  );

  let promise = inFlightRequests.get(dedupKey) as
    | Promise<ApiResult<T>>
    | undefined;
  if (!promise) {
    promise = apiRequestInner<T>(path, options);
    inFlightRequests.set(dedupKey, promise as Promise<ApiResult<unknown>>);
    promise.finally(() => inFlightRequests.delete(dedupKey));
  }
  return promise;
}
