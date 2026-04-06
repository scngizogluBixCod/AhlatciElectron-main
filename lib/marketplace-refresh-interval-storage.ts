/**
 * Dashboard yenilenme süresi (saniye) - localStorage
 */

export const MARKETPLACE_REFRESH_INTERVAL_SECONDS_STORAGE_KEY =
  "marketplace.refresh_interval_seconds";
const LEGACY_MARKETPLACE_REFRESH_INTERVAL_MINUTES_STORAGE_KEY =
  "marketplace.refresh_interval_minutes";

function parseStoredInteger(value: string | null): number | null {
  if (value === null) return null;
  const n = Number(value);
  if (!Number.isFinite(n) || !Number.isInteger(n) || !Number.isSafeInteger(n)) {
    return null;
  }
  return n;
}

export function getStoredMarketplaceRefreshIntervalSeconds(): number | null {
  if (typeof window === "undefined") return null;
  try {
    const seconds = parseStoredInteger(
      window.localStorage.getItem(
        MARKETPLACE_REFRESH_INTERVAL_SECONDS_STORAGE_KEY,
      ),
    );
    if (seconds !== null) return seconds;

    const legacyMinutes = parseStoredInteger(
      window.localStorage.getItem(
        LEGACY_MARKETPLACE_REFRESH_INTERVAL_MINUTES_STORAGE_KEY,
      ),
    );
    return legacyMinutes !== null ? legacyMinutes * 60 : null;
  } catch {
    return null;
  }
}

export function setStoredMarketplaceRefreshIntervalSeconds(
  value: number,
): void {
  if (typeof window === "undefined") return;
  if (
    !Number.isFinite(value) ||
    !Number.isInteger(value) ||
    !Number.isSafeInteger(value)
  ) {
    return;
  }
  try {
    window.localStorage.setItem(
      MARKETPLACE_REFRESH_INTERVAL_SECONDS_STORAGE_KEY,
      String(value),
    );
    window.localStorage.removeItem(
      LEGACY_MARKETPLACE_REFRESH_INTERVAL_MINUTES_STORAGE_KEY,
    );
  } catch {
    // storage dolu / erişim yok
  }
}

export function clearStoredMarketplaceRefreshIntervalSeconds(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(
      MARKETPLACE_REFRESH_INTERVAL_SECONDS_STORAGE_KEY,
    );
    window.localStorage.removeItem(
      LEGACY_MARKETPLACE_REFRESH_INTERVAL_MINUTES_STORAGE_KEY,
    );
  } catch {
    // ignore
  }
}

export function getStoredMarketplaceRefreshIntervalMinutes(): number | null {
  const seconds = getStoredMarketplaceRefreshIntervalSeconds();
  if (seconds === null) return null;
  return Math.ceil(seconds / 60);
}

export function setStoredMarketplaceRefreshIntervalMinutes(value: number): void {
  setStoredMarketplaceRefreshIntervalSeconds(value * 60);
}

export function clearStoredMarketplaceRefreshIntervalMinutes(): void {
  clearStoredMarketplaceRefreshIntervalSeconds();
}

