import { NextResponse } from "next/server";

import { getMarketplaceTodayReport } from "@/lib/api/marketplace-today";

export const dynamic = "force-dynamic";

export async function GET() {
  const res = await getMarketplaceTodayReport();

  if (!res.ok) {
    return NextResponse.json(
      { ok: false, status: res.status, message: res.message },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
          Pragma: "no-cache",
          Expires: "0",
        },
      },
    );
  }

  return NextResponse.json(
    { ok: true, status: 200, data: res.data },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
        Pragma: "no-cache",
        Expires: "0",
      },
    },
  );
}

