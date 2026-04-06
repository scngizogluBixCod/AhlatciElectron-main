/** Çerez adları ve header (Edge middleware ile paylaşılır; `next/headers` içermez). */

export const AUTH_ACCESS_TOKEN = "auth.access_token";
/** Eski oturumlar için çerezden silinir; refresh artık localStorage'da tutulur. */
export const AUTH_REFRESH_TOKEN = "auth.refresh_token";
export const AUTH_TEMP_TOKEN = "auth.temp_token";
export const AUTH_ROLE = "auth.role";

/** Middleware refresh sonrası aynı istekte kullanılmak üzere eklenen header */
export const REFRESHED_ACCESS_TOKEN_HEADER = "x-refreshed-access-token";
