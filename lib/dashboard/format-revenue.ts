/** API'den gelen ondalık string → sayı */
export function parseRevenueString(value: string): number {
  const n = Number.parseFloat(value.replace(/\s/g, "").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

/** Kartlarda kısa gösterim (örn. 7,6M ₺, 980K ₺) */
export function formatCompactTry(value: string): string {
  const n = parseRevenueString(value);
  if (n >= 1_000_000) {
    const m = n / 1_000_000;
    return `${m.toLocaleString("tr-TR", { maximumFractionDigits: 1, minimumFractionDigits: m % 1 === 0 ? 0 : 1 })}M ₺`;
  }
  if (n >= 1000) {
    const k = Math.round(n / 1000);
    return `${k.toLocaleString("tr-TR")}K ₺`;
  }
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

/** Üst KPI satırı için tam TRY formatı */
export function formatFullTry(value: string): string {
  const n = parseRevenueString(value);
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}
