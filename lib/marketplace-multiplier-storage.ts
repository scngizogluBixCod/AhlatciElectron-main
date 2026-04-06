/**
 * Çarpan sayısı (dashboard hesaplamalarında kullanılmak üzere):
 * Sadece tarayıcı tarafında localStorage.
 */

export const MARKETPLACE_MULTIPLIER_STORAGE_KEY =
  "marketplace.multiplier";

function parseStoredInteger(value: string | null): number | null {
  if (value === null) return null;
  const n = Number(value);
  if (!Number.isFinite(n) || !Number.isInteger(n)) return null;
  if (!Number.isSafeInteger(n)) return null;
  return n;
}

export function getStoredMarketplaceMultiplier(): number | null {
  if (typeof window === "undefined") return null;
  try {
    return parseStoredInteger(
      window.localStorage.getItem(MARKETPLACE_MULTIPLIER_STORAGE_KEY),
    );
  } catch {
    return null;
  }
}

export function setStoredMarketplaceMultiplier(value: number): void {
  if (typeof window === "undefined") return;
  if (!Number.isFinite(value) || !Number.isInteger(value)) return;
  if (!Number.isSafeInteger(value)) return;
  try {
    window.localStorage.setItem(
      MARKETPLACE_MULTIPLIER_STORAGE_KEY,
      String(value),
    );
  } catch {
    // storage dolu / erişim yok
  }
}

export function clearStoredMarketplaceMultiplier(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(MARKETPLACE_MULTIPLIER_STORAGE_KEY);
  } catch {
    // ignore
  }
}

