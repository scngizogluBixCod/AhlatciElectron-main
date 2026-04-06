"use client";

import { clearStoredRefreshToken } from "@/lib/auth-refresh-storage";
import { clearStoredMarketplaceMultiplier } from "@/lib/marketplace-multiplier-storage";
import { clearStoredMarketplaceRefreshIntervalMinutes } from "@/lib/marketplace-refresh-interval-storage";

/**
 * Çıkış veya oturum hatasında auth/dashboard localStorage verileri temizlenir.
 */
export function clearAuthLocalStorage(): void {
  if (typeof window === "undefined") return;
  clearStoredRefreshToken();
  clearStoredMarketplaceMultiplier();
  clearStoredMarketplaceRefreshIntervalMinutes();
}
