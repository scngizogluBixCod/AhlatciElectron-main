import { cookies } from "next/headers";

import {
  AUTH_ACCESS_TOKEN,
  AUTH_REFRESH_TOKEN,
  AUTH_ROLE,
  AUTH_TEMP_TOKEN,
} from "./auth-constants";

export {
  AUTH_ACCESS_TOKEN,
  AUTH_REFRESH_TOKEN,
  AUTH_TEMP_TOKEN,
  AUTH_ROLE,
  REFRESHED_ACCESS_TOKEN_HEADER,
} from "./auth-constants";

/** Auth çerezleri: sabit maxAge yok; oturum çerezi (tarayıcı kapanınca silinir). */
const baseCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

/** Access + isteğe bağlı rol. Refresh token çerezde tutulmaz (localStorage, client). */
export async function setAuthCookies(accessToken: string, role?: string) {
  const store = await cookies();
  store.set(AUTH_ACCESS_TOKEN, accessToken, { ...baseCookieOptions });
  if (role != null) {
    store.set(AUTH_ROLE, role, { ...baseCookieOptions });
  }
}

/** Sadece access (refresh sonrası); rol çerezine dokunmaz. */
export async function setAccessTokenCookie(accessToken: string) {
  const store = await cookies();
  store.set(AUTH_ACCESS_TOKEN, accessToken, { ...baseCookieOptions });
}

export async function setRoleCookie(role: string) {
  const store = await cookies();
  store.set(AUTH_ROLE, role, { ...baseCookieOptions });
}

export async function getRoleCookie(): Promise<string | undefined> {
  const store = await cookies();
  return store.get(AUTH_ROLE)?.value;
}

export async function setTempTokenCookie(tempToken: string) {
  const store = await cookies();
  store.set(AUTH_TEMP_TOKEN, tempToken, { ...baseCookieOptions });
}

export async function getAccessToken(): Promise<string | undefined> {
  const store = await cookies();
  return store.get(AUTH_ACCESS_TOKEN)?.value;
}

export async function getTempToken(): Promise<string | undefined> {
  const store = await cookies();
  return store.get(AUTH_TEMP_TOKEN)?.value;
}

export async function clearTempToken() {
  const store = await cookies();
  store.delete(AUTH_TEMP_TOKEN);
}

export async function clearAuthCookies() {
  const store = await cookies();
  store.delete(AUTH_ACCESS_TOKEN);
  store.delete(AUTH_REFRESH_TOKEN);
  store.delete(AUTH_TEMP_TOKEN);
  store.delete(AUTH_ROLE);
}
