"use client";

import { TrendingUp, TrendingDown, ShoppingCart, Banknote } from "lucide-react";

import type { MarketplaceTodayTotalsDto } from "@/lib/api/marketplace-today";
import { formatFullTry } from "@/lib/dashboard/format-revenue";

export type OverviewCardsProps = {
  totals: MarketplaceTodayTotalsDto;
  onRevenueCardClick?: () => void;
  blinkEpoch?: number;
  changedFields?: {
    orderCount?: boolean;
    yesterdayOrderCount?: boolean;
    totalRevenue?: boolean;
    yesterdayTotalRevenue?: boolean;
    orderCountChangePercent?: boolean;
    revenueChangePercent?: boolean;
  };
};

function ChangeIndicator({
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
        className={`text-muted-foreground ${blinkClassName ?? ""}`}
      >
        —
      </span>
    );
  }
  const isPositive = value >= 0;
  return (
    <div
      key={blinkKey}
      className={`flex shrink-0 items-center gap-1.5 text-xs font-bold sm:text-sm lg:text-base min-[1920px]:text-lg ${isPositive ? "text-success" : "text-destructive"} ${blinkClassName ?? ""}`}
    >
      {isPositive ? (
        <TrendingUp className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 min-[1920px]:h-9 min-[1920px]:w-9" />
      ) : (
        <TrendingDown className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 min-[1920px]:h-9 min-[1920px]:w-9" />
      )}
      {isPositive ? "+" : ""}
      {value.toFixed(1)}%
    </div>
  );
}

export function OverviewCards({
  totals,
  onRevenueCardClick,
  blinkEpoch = 0,
  changedFields,
}: OverviewCardsProps) {
  const {
    orderCount,
    yesterdayOrderCount,
    totalRevenue,
    yesterdayTotalRevenue,
    orderCountChangePercent,
    revenueChangePercent,
  } = totals;

  return (
    <div className="flex w-full min-w-0 flex-col gap-3.5 lg:flex-row lg:gap-5 xl:gap-6">
      <div className="flex min-w-0 flex-1 items-center gap-3 rounded-xl border border-border bg-card px-3 py-2.5 sm:gap-3 sm:px-4 sm:py-3 md:px-5 md:py-3 min-[1920px]:gap-5 min-[1920px]:px-7 min-[1920px]:py-5">
        <div className="shrink-0 rounded-xl bg-blue-500/20 p-2.5 sm:p-3 lg:p-3.5">
          <ShoppingCart className="h-8 w-8 text-blue-400 sm:h-9 sm:w-9 lg:h-10 lg:w-10 min-[1920px]:h-12 min-[1920px]:w-12" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="mb-1.5 text-base font-semibold uppercase tracking-wide text-muted-foreground sm:mb-2 sm:text-lg lg:text-xl min-[1920px]:text-2xl">
            Toplam Sipariş
          </p>
          <div className="grid grid-cols-[auto_auto] items-start gap-x-5 gap-y-1.5 md:gap-x-7 lg:gap-x-8 min-[1920px]:gap-x-10 min-[1920px]:gap-y-2">
            <span className="inline-flex w-fit rounded-md bg-blue-500/30 px-3 py-1.5 text-sm font-extrabold uppercase tracking-wider text-blue-200 ring-1 ring-blue-400/40 sm:px-3.5 sm:py-2 sm:text-base min-[1920px]:px-4 min-[1920px]:py-2.5 min-[1920px]:text-lg">
              Bugün
            </span>
            <span className="inline-flex w-fit rounded-md bg-amber-500/25 px-3 py-1.5 text-sm font-extrabold uppercase tracking-wider text-amber-100 ring-1 ring-amber-400/35 sm:px-3.5 sm:py-2 sm:text-base min-[1920px]:px-4 min-[1920px]:py-2.5 min-[1920px]:text-lg">
              Dün
            </span>
            <span className="self-end text-2xl font-black tabular-nums tracking-tight text-foreground sm:text-3xl lg:text-4xl xl:text-5xl min-[1920px]:text-6xl">
              <span
                key={changedFields?.orderCount ? `totals-orderCount-${blinkEpoch}` : "totals-orderCount"}
                className={changedFields?.orderCount ? "dashboard-updated-blink" : undefined}
              >
              {orderCount}
              </span>
            </span>
            <span className="self-end text-xl font-bold tabular-nums tracking-tight text-foreground sm:text-2xl lg:text-3xl min-[1920px]:text-4xl">
              <span
                key={
                  changedFields?.yesterdayOrderCount
                    ? `totals-yesterdayOrderCount-${blinkEpoch}`
                    : "totals-yesterdayOrderCount"
                }
                className={changedFields?.yesterdayOrderCount ? "dashboard-updated-blink" : undefined}
              >
              {yesterdayOrderCount}
              </span>
            </span>
          </div>
        </div>
        <ChangeIndicator
          value={orderCountChangePercent}
          blinkKey={
            changedFields?.orderCountChangePercent
              ? `totals-orderCountChangePercent-${blinkEpoch}`
              : "totals-orderCountChangePercent"
          }
          blinkClassName={changedFields?.orderCountChangePercent ? "dashboard-updated-blink" : undefined}
        />
      </div>

      <button
        type="button"
        onClick={onRevenueCardClick}
        className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 rounded-xl border border-border bg-card px-3 py-2.5 text-left transition-colors hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 sm:gap-3 sm:px-4 sm:py-3 md:px-5 md:py-3 min-[1920px]:gap-5 min-[1920px]:px-7 min-[1920px]:py-5"
      >
        <div className="shrink-0 rounded-xl bg-emerald-500/20 p-2.5 sm:p-3 lg:p-3.5">
          <Banknote className="h-8 w-8 text-emerald-400 sm:h-9 sm:w-9 lg:h-10 lg:w-10 min-[1920px]:h-12 min-[1920px]:w-12" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="mb-1.5 text-base font-semibold uppercase tracking-wide text-muted-foreground sm:mb-2 sm:text-lg lg:text-xl min-[1920px]:text-2xl">
            Toplam Ciro
          </p>
          <div className="grid grid-cols-[auto_auto] items-start gap-x-5 gap-y-1.5 md:gap-x-7 lg:gap-x-8 min-[1920px]:gap-x-10 min-[1920px]:gap-y-2">
            <span className="inline-flex w-fit rounded-md bg-blue-500/30 px-3 py-1.5 text-sm font-extrabold uppercase tracking-wider text-blue-200 ring-1 ring-blue-400/40 sm:px-3.5 sm:py-2 sm:text-base min-[1920px]:px-4 min-[1920px]:py-2.5 min-[1920px]:text-lg">
              Bugün
            </span>
            <span className="inline-flex w-fit rounded-md bg-amber-500/25 px-3 py-1.5 text-sm font-extrabold uppercase tracking-wider text-amber-100 ring-1 ring-amber-400/35 sm:px-3.5 sm:py-2 sm:text-base min-[1920px]:px-4 min-[1920px]:py-2.5 min-[1920px]:text-lg">
              Dün
            </span>
            <span className="self-end text-lg font-black tabular-nums leading-none tracking-tight text-foreground sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl min-[1920px]:text-5xl">
              <span
                key={changedFields?.totalRevenue ? `totals-totalRevenue-${blinkEpoch}` : "totals-totalRevenue"}
                className={changedFields?.totalRevenue ? "dashboard-updated-blink" : undefined}
              >
              {formatFullTry(totalRevenue)}
              </span>
            </span>
            <span className="self-end text-base font-bold tabular-nums leading-none tracking-tight text-foreground sm:text-lg md:text-xl lg:text-2xl min-[1920px]:text-3xl">
              <span
                key={
                  changedFields?.yesterdayTotalRevenue
                    ? `totals-yesterdayTotalRevenue-${blinkEpoch}`
                    : "totals-yesterdayTotalRevenue"
                }
                className={changedFields?.yesterdayTotalRevenue ? "dashboard-updated-blink" : undefined}
              >
              {formatFullTry(yesterdayTotalRevenue)}
              </span>
            </span>
          </div>
        </div>
        <ChangeIndicator
          value={revenueChangePercent}
          blinkKey={
            changedFields?.revenueChangePercent
              ? `totals-revenueChangePercent-${blinkEpoch}`
              : "totals-revenueChangePercent"
          }
          blinkClassName={changedFields?.revenueChangePercent ? "dashboard-updated-blink" : undefined}
        />
      </button>
    </div>
  );
}
