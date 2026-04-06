import { cookies } from "next/headers";

export const APP_LANG_COOKIE = "app_lang";
export const DEFAULT_LANG = "tr";

export type AppLang = "tr" | "en";

/** API Accept-Language ve sunucu bileşenleri için dil (admin ile uyumlu). */
export async function getAppLang(): Promise<AppLang> {
  const store = await cookies();
  const lang = store.get(APP_LANG_COOKIE)?.value as AppLang;
  return lang || DEFAULT_LANG;
}
