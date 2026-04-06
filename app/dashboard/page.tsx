import { cookies } from "next/headers";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { DashboardView } from "@/components/dashboard/DashboardView";
import { DashboardFetchError } from "@/components/dashboard/DashboardFetchError";
import { getMarketplaceTodayReport } from "@/lib/api/marketplace-today";
import { AUTH_ACCESS_TOKEN } from "@/lib/auth-constants";

export const metadata: Metadata = {
  title: "Sipariş özeti",
  description: "E-ticaret sipariş özeti ve platform performans takibi",
};

export default async function DashboardPage() {
  const token = (await cookies()).get(AUTH_ACCESS_TOKEN)?.value;
  if (!token) {
    redirect("/auth/login?from=/dashboard");
  }

  const res = await getMarketplaceTodayReport();
  if (!res.ok) {
    return <DashboardFetchError message={res.message} />;
  }

  return <DashboardView report={res.data} />;
}
