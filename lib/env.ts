/**
 * Server-side ortam değişkenleri.
 * API_BASE_URL ve API_CLIENT_KEY yalnızca sunucuda kullanılır (.env.local).
 * Dokploy gibi ortamlarda host:port/v1 verilirse önüne http:// eklenir.
 */

/** Protokol yoksa http:// ekler (Dokploy iç ağı için). */
export function ensureAbsoluteUrl(url: string): string {
  const trimmed = url.replace(/\/$/, "");
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `http://${trimmed}`;
}

export function getBaseUrl(): string {
  const proxyUrl = process.env.ADMIN_PROXY_URL;
  if (!proxyUrl)
    throw new Error("ADMIN_PROXY_URL ortam değişkeni tanımlı değil (.env.local)");
  
  // Proxy URL'sinin sonuna /proxy?path= ekleyerek client'ın kullanabileceği bir base url dönüyoruz
  const absoluteUrl = ensureAbsoluteUrl(proxyUrl);
  // Eğer zaten /proxy ile bitmiyorsa ekle
  return absoluteUrl.endsWith("/proxy") ? absoluteUrl : `${absoluteUrl}/proxy`;
}

export function getProxySecret(): string {
  const secret = process.env.PROXY_SHARED_SECRET;
  if (!secret)
    throw new Error(
      "PROXY_SHARED_SECRET ortam değişkeni tanımlı değil (.env.local)",
    );
  return secret;
}

export function getApiKey(): string {
  // Proxy üzerinden gittiği için sahte bir key dönüyoruz, asıl key admin de duruyor
  return "proxy_mode";
}

/** Sunucu bileşenlerinde güvenli kontrol (getBaseUrl atmadan). */
export function isApiConfigured(): boolean {
  return Boolean(process.env.ADMIN_PROXY_URL && process.env.PROXY_SHARED_SECRET);
}
