import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { DashboardView } from "@/components/dashboard/DashboardView";
import { DashboardFetchError } from "@/components/dashboard/DashboardFetchError";
import { getMarketplaceTodayReport } from "@/lib/api/marketplace-today";
import { AUTH_ACCESS_TOKEN } from "@/lib/auth-constants";

export default async function Home() {
  const token = (await cookies()).get(AUTH_ACCESS_TOKEN)?.value;
  if (!token) {
    redirect("/auth/login?from=/");
  }

  const res = await getMarketplaceTodayReport();
  if (!res.ok) {
    return <DashboardFetchError message={res.message} />;
  }

  return <DashboardView report={res.data} />;
}
