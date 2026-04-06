import type { MarketplaceTodayPlatformDto } from "@/lib/api/marketplace-today";

/** `public/agent-marketplace-logos/` altındaki dosya adları (API kodu → dosya) */
const LOGO_FILE_BY_PLATFORM: Record<string, string> = {
  TRENDYOL: "Trendyol.svg",
  HEPSIBURADA: "Hepsiburada.svg",
  N11: "N11.svg",
  PTTAVM: "Pttavm.svg",
  AHLPAY: "ahlpay.svg",
  PAZARAMA: "Pazarama.svg",
  PASSO: "Passo.svg",
  IDEFIX: "Idefix.svg",
  DKB: "DKB.svg",
};

const FALLBACK_LOGO = "Store.svg";
export const MARKETPLACE_LOGO_BASE = "/agent-marketplace-logos";

const PLATFORM_LABEL: Record<string, string> = {
  TRENDYOL: "Trendyol",
  HEPSIBURADA: "Hepsiburada",
  N11: "N11",
  AMAZON_TR: "Amazon TR",
  AMAZON: "Amazon TR",
  CICEKSEPETI: "Çiçeksepeti",
  PTTAVM: "PTTAVM",
  FLO: "FLO",
  BOYNER: "Boyner",
  LCW: "LCW",
  MANGO: "Mango",
  PAZARAMA: "Pazarama",
  PASSO: "Passo",
  IDEFIX: "Idefix",
  DKB: "DKB",
};

function titleCaseTr(raw: string): string {
  return raw
    .split(/\s+/)
    .map((w) => w.charAt(0).toLocaleUpperCase("tr-TR") + w.slice(1).toLowerCase())
    .join(" ");
}

export function marketplaceLogoSrc(platformCode: string): string {
  const key = platformCode.trim().toUpperCase();
  const file = LOGO_FILE_BY_PLATFORM[key] ?? FALLBACK_LOGO;
  return `${MARKETPLACE_LOGO_BASE}/${file}`;
}

export type PlatformCardModel = MarketplaceTodayPlatformDto & {
  /** Erişilebilirlik için (logo alt metni) */
  displayName: string;
  logoSrc: string;
};

export function toPlatformCardRow(p: MarketplaceTodayPlatformDto): PlatformCardModel {
  const key = p.platform.trim().toUpperCase();
  const displayName =
    PLATFORM_LABEL[key] ?? titleCaseTr(key.replace(/_/g, " "));
  const logoSrc = marketplaceLogoSrc(p.platform);

  return {
    ...p,
    displayName,
    logoSrc,
  };
}
