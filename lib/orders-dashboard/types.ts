export interface PlatformMetrics {
  platform: string;
  orderCount: number;
  totalRevenue: string;
  yesterdayOrderCount: number;
  yesterdayTotalRevenue: string;
  orderCountChangePercent: number;
  revenueChangePercent: number;
}

export interface TotalsMetrics {
  orderCount: number;
  totalRevenue: string;
  yesterdayOrderCount: number;
  yesterdayTotalRevenue: string;
  orderCountChangePercent: number;
  revenueChangePercent: number;
}

export interface OrdersDashboardData {
  todayFrom: string;
  snapshotAt: string;
  platforms: PlatformMetrics[];
  totals: TotalsMetrics;
}

export interface OrdersDashboardResponse {
  success: boolean;
  data: OrdersDashboardData;
  message: string;
  timestamp: string;
}
