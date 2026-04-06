/**
 * Backend refresh/login cevaplarından access + refresh çiftini çıkarır (admin ile aynı).
 */
export function extractAccessRefreshPair(
  body: unknown,
): { accessToken: string; refreshToken: string } | null {
  if (!body || typeof body !== "object") return null;
  const o = body as Record<string, unknown>;

  if (o.success === false) return null;

  const data = (o.data as Record<string, unknown>) ?? o;
  const accessToken = data.accessToken as string | undefined;
  const refreshToken = data.refreshToken as string | undefined;

  if (typeof accessToken === "string" && typeof refreshToken === "string") {
    return { accessToken, refreshToken };
  }
  return null;
}
