"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import type { MarketplaceTodayDto } from "@/lib/api/marketplace-today";

import { OverviewCards } from "@/components/dashboard/overview-cards";
import { PlatformGrid } from "@/components/dashboard/platform-grid";
import { MultiplierSetupModal } from "@/components/MultiplierSetupModal";
import { getStoredMarketplaceMultiplier } from "@/lib/marketplace-multiplier-storage";
import { setStoredMarketplaceMultiplier } from "@/lib/marketplace-multiplier-storage";
import {
  getStoredMarketplaceRefreshIntervalSeconds,
  setStoredMarketplaceRefreshIntervalSeconds,
} from "@/lib/marketplace-refresh-interval-storage";

export type DashboardViewProps = {
  report: MarketplaceTodayDto;
};

type TotalsChangeFlags = {
  orderCount: boolean;
  yesterdayOrderCount: boolean;
  totalRevenue: boolean;
  yesterdayTotalRevenue: boolean;
  orderCountChangePercent: boolean;
  revenueChangePercent: boolean;
};

type PlatformChangeFlags = TotalsChangeFlags;

type ChangedFields = {
  totals: TotalsChangeFlags;
  platforms: Record<string, PlatformChangeFlags>;
};

const EMPTY_TOTAL_FLAGS: TotalsChangeFlags = {
  orderCount: false,
  yesterdayOrderCount: false,
  totalRevenue: false,
  yesterdayTotalRevenue: false,
  orderCountChangePercent: false,
  revenueChangePercent: false,
};

const EMPTY_CHANGED_FIELDS: ChangedFields = {
  totals: EMPTY_TOTAL_FLAGS,
  platforms: {},
};

export function DashboardView({ report }: DashboardViewProps) {
  const [effectiveMultiplier, setEffectiveMultiplier] = useState(() => {
    const storedMultiplier = getStoredMarketplaceMultiplier();
    return storedMultiplier !== null && storedMultiplier > 0 ? storedMultiplier : 1;
  });
  const [refreshIntervalSeconds, setRefreshIntervalSeconds] = useState(() => {
    const storedRefreshInterval = getStoredMarketplaceRefreshIntervalSeconds();
    return storedRefreshInterval && storedRefreshInterval > 0
      ? storedRefreshInterval
      : null;
  });
  const [isMultiplierModalOpen, setIsMultiplierModalOpen] = useState(false);

  const refreshIntervalMs = refreshIntervalSeconds
    ? refreshIntervalSeconds * 1_000
    : null;

  const [reportState, setReportState] = useState(report);
  useEffect(() => {
    setReportState(report);
  }, [report]);

  const fetchInProgressRef = useRef(false);
  useEffect(() => {
    if (!refreshIntervalMs) return;

    async function tick() {
      if (fetchInProgressRef.current) return;
      fetchInProgressRef.current = true;
      try {
        const res = await fetch(
          `/api/dashboard/marketplace-today?ts=${Date.now()}`,
          {
          method: "GET",
          cache: "no-store",
          headers: {
            "Cache-Control": "no-cache",
            Pragma: "no-cache",
          },
        });

        const json = (await res.json().catch(() => null)) as
          | { ok?: boolean; data?: MarketplaceTodayDto }
          | null;

        if (!json?.ok || !json.data) return;
        setReportState(json.data);
      } catch (error) {
        console.error("[Dashboard] Marketplace today refresh failed", error);
      } finally {
        fetchInProgressRef.current = false;
      }
    }

    void tick();
    const id = window.setInterval(tick, refreshIntervalMs);
    return () => {
      window.clearInterval(id);
    };
  }, [refreshIntervalMs]);

  const adjustedReport = useMemo<MarketplaceTodayDto>(() => {
    return {
      ...reportState,
      totals: {
        ...reportState.totals,
        orderCount: reportState.totals.orderCount * effectiveMultiplier,
        yesterdayOrderCount:
          reportState.totals.yesterdayOrderCount * effectiveMultiplier,
      },
      platforms: reportState.platforms.map((p) => ({
        ...p,
        orderCount: p.orderCount * effectiveMultiplier,
        yesterdayOrderCount: p.yesterdayOrderCount * effectiveMultiplier,
      })),
    };
  }, [reportState, effectiveMultiplier]);

  const [changedFields, setChangedFields] = useState<ChangedFields>(EMPTY_CHANGED_FIELDS);
  const [blinkEpoch, setBlinkEpoch] = useState(0);
  const previousAdjustedReportRef = useRef<MarketplaceTodayDto | null>(null);

  useEffect(() => {
    const previous = previousAdjustedReportRef.current;
    if (!previous) {
      previousAdjustedReportRef.current = adjustedReport;
      return;
    }

    const totals: TotalsChangeFlags = {
      orderCount: previous.totals.orderCount !== adjustedReport.totals.orderCount,
      yesterdayOrderCount:
        previous.totals.yesterdayOrderCount !== adjustedReport.totals.yesterdayOrderCount,
      totalRevenue: previous.totals.totalRevenue !== adjustedReport.totals.totalRevenue,
      yesterdayTotalRevenue:
        previous.totals.yesterdayTotalRevenue !== adjustedReport.totals.yesterdayTotalRevenue,
      orderCountChangePercent:
        previous.totals.orderCountChangePercent !== adjustedReport.totals.orderCountChangePercent,
      revenueChangePercent:
        previous.totals.revenueChangePercent !== adjustedReport.totals.revenueChangePercent,
    };

    const previousPlatformMap = new Map(
      previous.platforms.map((platform) => [platform.platform, platform]),
    );

    const platformFlags: Record<string, PlatformChangeFlags> = {};
    for (const platform of adjustedReport.platforms) {
      const prevPlatform = previousPlatformMap.get(platform.platform);
      if (!prevPlatform) continue;

      platformFlags[platform.platform] = {
        orderCount: prevPlatform.orderCount !== platform.orderCount,
        yesterdayOrderCount:
          prevPlatform.yesterdayOrderCount !== platform.yesterdayOrderCount,
        totalRevenue: prevPlatform.totalRevenue !== platform.totalRevenue,
        yesterdayTotalRevenue:
          prevPlatform.yesterdayTotalRevenue !== platform.yesterdayTotalRevenue,
        orderCountChangePercent:
          prevPlatform.orderCountChangePercent !== platform.orderCountChangePercent,
        revenueChangePercent:
          prevPlatform.revenueChangePercent !== platform.revenueChangePercent,
      };
    }

    const hasTotalsChange = Object.values(totals).some(Boolean);
    const hasPlatformChange = Object.values(platformFlags).some((flags) =>
      Object.values(flags).some(Boolean),
    );

    setChangedFields({ totals, platforms: platformFlags });
    if (hasTotalsChange || hasPlatformChange) {
      setBlinkEpoch((current) => current + 1);
    }

    previousAdjustedReportRef.current = adjustedReport;
  }, [adjustedReport]);

  return (
    <div className="relative flex min-h-dvh flex-col bg-background">
      <main className="flex flex-col gap-3 px-4 py-3 sm:gap-4 sm:px-6 sm:py-4 min-[1920px]:gap-6 min-[1920px]:px-10 min-[1920px]:py-8">
        <div className="shrink-0">
          <OverviewCards
            totals={adjustedReport.totals}
            changedFields={changedFields.totals}
            blinkEpoch={blinkEpoch}
            onRevenueCardClick={() => setIsMultiplierModalOpen(true)}
          />
        </div>
        <PlatformGrid
          platforms={adjustedReport.platforms}
          changedFields={changedFields.platforms}
          blinkEpoch={blinkEpoch}
        />
      </main>
      <MultiplierSetupModal
        open={isMultiplierModalOpen}
        variant="dashboard"
        onClose={() => setIsMultiplierModalOpen(false)}
        onSave={({ multiplier, refreshIntervalSeconds: nextRefreshSeconds }) => {
          setStoredMarketplaceMultiplier(multiplier);
          setStoredMarketplaceRefreshIntervalSeconds(nextRefreshSeconds);
          setEffectiveMultiplier(multiplier);
          setRefreshIntervalSeconds(nextRefreshSeconds);
          setIsMultiplierModalOpen(false);
        }}
      />
    </div>
  );
}
