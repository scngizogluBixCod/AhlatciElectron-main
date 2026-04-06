/**
 * Refresh token (tarayıcı): sadece client tarafında localStorage.
 * Sunucu bileşenleri ve middleware bu değeri okuyamaz.
 * Admin ile aynı anahtar: auth.refresh_token
 */

export const AUTH_REFRESH_TOKEN_STORAGE_KEY = "auth.refresh_token";

export function getStoredRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(AUTH_REFRESH_TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setStoredRefreshToken(token: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(AUTH_REFRESH_TOKEN_STORAGE_KEY, token);
  } catch {
    // storage dolu veya devre dışı
  }
}

export function clearStoredRefreshToken(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(AUTH_REFRESH_TOKEN_STORAGE_KEY);
  } catch {
    // ignore
  }
}
