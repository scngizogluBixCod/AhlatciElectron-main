import { apiRequest } from "@/lib/api";
import { isApiConfigured } from "@/lib/env";

/** Swagger: MarketplaceTodayPlatformDto */
export type MarketplaceTodayPlatformDto = {
  platform: string;
  orderCount: number;
  totalRevenue: string;
  yesterdayOrderCount: number;
  yesterdayTotalRevenue: string;
  orderCountChangePercent: number | null;
  revenueChangePercent: number | null;
};

/** Swagger: MarketplaceTodayTotalsDto */
export type MarketplaceTodayTotalsDto = {
  orderCount: number;
  totalRevenue: string;
  yesterdayOrderCount: number;
  yesterdayTotalRevenue: string;
  orderCountChangePercent: number | null;
  revenueChangePercent: number | null;
};

/** Swagger: MarketplaceTodayDto */
export type MarketplaceTodayDto = {
  todayFrom: string;
  snapshotAt: string;
  yesterdaySnapshotAt?: string;
  platforms: MarketplaceTodayPlatformDto[];
  totals: MarketplaceTodayTotalsDto;
};

type ApiSuccessEnvelope<T> = {
  success: true;
  data: T;
  message?: string;
  timestamp?: string;
};

function unwrapMarketplaceBody(
  body: unknown,
): MarketplaceTodayDto | null {
  if (body === null || typeof body !== "object") return null;
  const o = body as Record<string, unknown>;
  if (
    "success" in o &&
    o.success === true &&
    "data" in o &&
    typeof o.data === "object" &&
    o.data !== null
  ) {
    const inner = o.data as Record<string, unknown>;
    if ("platforms" in inner && "totals" in inner) {
      return (o as ApiSuccessEnvelope<MarketplaceTodayDto>).data;
    }
  }
  if ("platforms" in o && "totals" in o) {
    return body as MarketplaceTodayDto;
  }
  return null;
}

export type MarketplaceTodayReportResult =
  | { ok: true; data: MarketplaceTodayDto }
  | { ok: false; message: string; status: number };

/**
 * GET /v1/admin/reports/marketplace-today — sunucu bileşenlerinde çağrılır.
 * Kimlik: Bearer (çerez) + X-API-Key (@/lib/api/client).
 */
export async function getMarketplaceTodayReport(): Promise<MarketplaceTodayReportResult> {
  if (!isApiConfigured()) {
    return {
      ok: false,
      message: "API_BASE_URL veya API_CLIENT_KEY tanımlı değil (.env.local)",
      status: 0,
    };
  }

  const result = await apiRequest<unknown>("/admin/reports/marketplace-today", {
    method: "GET",
    cache: "no-store",
  });

  if (result.error) {
    const msg = result.error.message;
    const message = Array.isArray(msg) ? msg.join(", ") : String(msg);
    return { ok: false, message, status: result.status };
  }

  const dto = unwrapMarketplaceBody(result.data);
  if (!dto) {
    return {
      ok: false,
      message: "Pazaryeri özeti yanıtı okunamadı",
      status: result.status,
    };
  }

  return { ok: true, data: dto };
}
