"use client";

import Image from "next/image";
import { TrendingUp, TrendingDown } from "lucide-react";

import type { MarketplaceTodayPlatformDto } from "@/lib/api/marketplace-today";
import { formatFullTry } from "@/lib/dashboard/format-revenue";
import { toPlatformCardRow } from "@/lib/dashboard/platform-visual";

export type PlatformGridProps = {
  platforms: MarketplaceTodayPlatformDto[];
  blinkEpoch?: number;
  changedFields?: Record<
    string,
    {
      orderCount?: boolean;
      yesterdayOrderCount?: boolean;
      totalRevenue?: boolean;
      yesterdayTotalRevenue?: boolean;
      orderCountChangePercent?: boolean;
      revenueChangePercent?: boolean;
    }
  >;
};

/** TV / uzak okuma için trend metni */
function Change({
  value,
  blinkClassName,
  blinkKey,
}: {
  value: number | null;
  blinkClassName?: string;
  blinkKey?: string;
}) {
  if (value === null || Number.isNaN(value)) {
    return (
      <span
        key={blinkKey}
        className={`text-xs font-bold text-muted-foreground sm:text-sm lg:text-base min-[1920px]:text-lg ${blinkClassName ?? ""}`}
      >
        —
      </span>
    );
  }
  const isPositive = value >= 0;
  return (
    <span
      key={blinkKey}
      className={`inline-flex shrink-0 items-center gap-1.5 text-xs font-bold sm:text-sm lg:text-base min-[1920px]:text-lg ${isPositive ? "text-success" : "text-destructive"} ${blinkClassName ?? ""}`}
    >
      {isPositive ? (
        <TrendingUp className="h-5 w-5 shrink-0 sm:h-6 sm:w-6 md:h-7 md:w-7 min-[1920px]:h-8 min-[1920px]:w-8" />
      ) : (
        <TrendingDown className="h-5 w-5 shrink-0 sm:h-6 sm:w-6 md:h-7 md:w-7 min-[1920px]:h-8 min-[1920px]:w-8" />
      )}
      {isPositive ? "+" : ""}
      {value.toFixed(1)}%
    </span>
  );
}

/**
 * 10 platform: 2 sütun → 5 satır. Üst KPI ile aynı kart padding’i; TV için büyütülmüş tipografi.
 */
export function PlatformGrid({
  platforms,
  blinkEpoch = 0,
  changedFields = {},
}: PlatformGridProps) {
  const rows = [...platforms]
    .map(toPlatformCardRow)
    .sort((a, b) => b.orderCount - a.orderCount);


  if (rows.length === 0) {
    return (
      <div className="flex min-h-48 items-center justify-center rounded-xl border border-dashed border-border px-4 py-8 text-center text-lg text-muted-foreground sm:text-xl md:text-2xl">
        Henüz pazaryeri verisi yok.
      </div>
    );
  }

  return (
    <div className="flex flex-col pb-1">
      <div className="grid grid-cols-2 gap-3 sm:gap-3.5 md:gap-4 min-[1920px]:gap-5">
        {rows.map((p) => {
          const platformChangedFields = changedFields[p.platform];
          return (
          <div
            key={p.platform}
            className="flex min-w-0 items-center gap-2.5 rounded-xl border border-border bg-card px-3.5 py-3 shadow-sm transition-colors hover:border-primary/50 sm:gap-3.5 sm:px-5 sm:py-3.5 md:gap-4 md:px-6 md:py-4 min-[1920px]:px-7 min-[1920px]:py-5"
          >
            {/* Kolon 1 – Logo */}
            <div className="relative h-14 w-28 shrink-0 overflow-hidden rounded-xl sm:h-16 sm:w-32 md:h-17 md:w-36 min-[1920px]:h-22 min-[1920px]:w-40">
              <Image
                src={p.logoSrc}
                alt={p.displayName}
                fill
                sizes="(max-width: 768px) 112px, 160px"
                className="object-contain object-center p-1 sm:p-1.5"
                unoptimized
              />
            </div>
            {/* Sipariş + Ciro – paylaşımlı 2 satır grid */}
            <div className="grid min-w-0 flex-1 grid-cols-[auto_1fr] grid-rows-2 items-center gap-x-3 gap-y-1.5 sm:gap-x-4 sm:gap-y-2 md:gap-x-5">

              {/* Satır 1, Kolon 1 – Bugün sipariş */}
              <div className="flex items-center gap-2 border-l border-border pl-3 sm:gap-2.5 sm:pl-4 md:pl-5 min-[1920px]:pl-6">
                <span className="inline-flex w-14 justify-center rounded-md bg-blue-500/30 px-2.5 py-1 text-xs font-extrabold uppercase tracking-wider text-blue-200 ring-1 ring-blue-400/40 sm:w-16 sm:px-3 sm:py-1.5 sm:text-sm md:w-20 md:text-base min-[1920px]:w-24 min-[1920px]:text-lg">
                  Bugün
                </span>
                <span className="text-xl font-black tabular-nums leading-none tracking-tight text-foreground sm:text-2xl md:text-3xl lg:text-4xl min-[1920px]:text-5xl">
                  <span
                    key={
                      platformChangedFields?.orderCount
                        ? `${p.platform}-orderCount-${blinkEpoch}`
                        : `${p.platform}-orderCount`
                    }
                    className={platformChangedFields?.orderCount ? "dashboard-updated-blink" : undefined}
                  >
                    {p.orderCount}
                  </span>
                </span>
              </div>

              {/* Satır 1, Kolon 2 – Bugün ciro + trend */}
              <div className="relative flex items-center border-l border-border pl-3 sm:pl-4 md:pl-5 min-[1920px]:pl-6">
                <div className="absolute right-0 top-0">
                  <Change
                    value={p.revenueChangePercent}
                    blinkKey={
                      platformChangedFields?.revenueChangePercent
                        ? `${p.platform}-revenueChangePercent-${blinkEpoch}`
                        : `${p.platform}-revenueChangePercent`
                    }
                    blinkClassName={
                      platformChangedFields?.revenueChangePercent
                        ? "dashboard-updated-blink"
                        : undefined
                    }
                  />
                </div>
                <span className="wrap-break-word text-lg font-black tabular-nums leading-tight tracking-tight text-foreground sm:text-xl md:text-2xl lg:text-3xl min-[1920px]:text-4xl">
                  <span
                    key={
                      platformChangedFields?.totalRevenue
                        ? `${p.platform}-totalRevenue-${blinkEpoch}`
                        : `${p.platform}-totalRevenue`
                    }
                    className={platformChangedFields?.totalRevenue ? "dashboard-updated-blink" : undefined}
                  >
                    {formatFullTry(p.totalRevenue)}
                  </span>
                </span>
              </div>

              {/* Satır 2, Kolon 1 – Dün sipariş */}
              <div className="flex items-center gap-2 border-l border-border pl-3 sm:gap-2.5 sm:pl-4 md:pl-5 min-[1920px]:pl-6">
                <span className="inline-flex w-14 justify-center rounded-md bg-amber-500/25 px-2.5 py-1 text-xs font-extrabold uppercase tracking-wider text-amber-100 ring-1 ring-amber-400/35 sm:w-16 sm:px-3 sm:py-1.5 sm:text-sm md:w-20 md:text-base min-[1920px]:w-24 min-[1920px]:text-lg">
                  Dün
                </span>
                <span className="text-lg font-bold tabular-nums leading-none tracking-tight text-foreground sm:text-xl md:text-2xl lg:text-3xl min-[1920px]:text-4xl">
                  <span
                    key={
                      platformChangedFields?.yesterdayOrderCount
                        ? `${p.platform}-yesterdayOrderCount-${blinkEpoch}`
                        : `${p.platform}-yesterdayOrderCount`
                    }
                    className={platformChangedFields?.yesterdayOrderCount ? "dashboard-updated-blink" : undefined}
                  >
                    {p.yesterdayOrderCount}
                  </span>
                </span>
              </div>

              {/* Satır 2, Kolon 2 – Dün ciro */}
              <div className="flex items-center border-l border-border pl-3 sm:pl-4 md:pl-5 min-[1920px]:pl-6">
                <span className="wrap-break-word text-base font-bold tabular-nums leading-tight tracking-tight text-muted-foreground sm:text-lg md:text-xl lg:text-2xl min-[1920px]:text-3xl">
                  <span
                    key={
                      platformChangedFields?.yesterdayTotalRevenue
                        ? `${p.platform}-yesterdayTotalRevenue-${blinkEpoch}`
                        : `${p.platform}-yesterdayTotalRevenue`
                    }
                    className={platformChangedFields?.yesterdayTotalRevenue ? "dashboard-updated-blink" : undefined}
                  >
                    {formatFullTry(p.yesterdayTotalRevenue)}
                  </span>
                </span>
              </div>

            </div>
          </div>
          );
        })}
      </div>
    </div>
  );
}
