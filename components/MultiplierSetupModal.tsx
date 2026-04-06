"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { clearAuthLocalStorage } from "@/lib/auth-client-cleanup";
import { getStoredMarketplaceRefreshIntervalSeconds } from "@/lib/marketplace-refresh-interval-storage";

export type MultiplierSetupModalProps = {
  open: boolean;
  onSave: (args: { multiplier: number; refreshIntervalSeconds: number }) => void;
  variant?: "onboarding" | "dashboard";
  onClose?: () => void;
};

const inputClass =
  "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-center text-lg shadow-xs transition-[color,box-shadow] outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]";

const buttonClass =
  "inline-flex h-10 w-full items-center justify-center gap-2 whitespace-nowrap rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90 focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50";

export function MultiplierSetupModal({
  open,
  onSave,
  variant = "onboarding",
  onClose,
}: MultiplierSetupModalProps) {
  const [rawMultiplier, setRawMultiplier] = useState("1");
  const [rawRefreshSeconds, setRawRefreshSeconds] = useState("300");
  const [error, setError] = useState<string | null>(null);

  const parsedMultiplier = useMemo(() => {
    const n = Number(rawMultiplier);
    if (
      !Number.isFinite(n) ||
      !Number.isInteger(n) ||
      !Number.isSafeInteger(n)
    ) {
      return null;
    }
    return n;
  }, [rawMultiplier]);

  const parsedRefreshSeconds = useMemo(() => {
    const n = Number(rawRefreshSeconds);
    if (
      !Number.isFinite(n) ||
      !Number.isInteger(n) ||
      !Number.isSafeInteger(n)
    ) {
      return null;
    }
    if (n <= 0) return null;
    return n;
  }, [rawRefreshSeconds]);

  useEffect(() => {
    if (!open) return;

    if (variant === "dashboard") {
      const storedRefreshInterval = getStoredMarketplaceRefreshIntervalSeconds();
      if (storedRefreshInterval && storedRefreshInterval > 0) {
        setRawRefreshSeconds(String(storedRefreshInterval));
      } else {
        setRawRefreshSeconds("300");
      }
    }

    // Modal açıkken arka plandaki kaydırmayı kapatalım.
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [open, variant]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-md px-4"
        // Dış tıklama ile kapanmasın diye
        onMouseDown={(e) => e.stopPropagation()}
      >
        <Card className="overflow-hidden">
          <CardHeader className="relative pr-12">
            {onClose ? (
              <button
                type="button"
                onClick={onClose}
                className="text-muted-foreground hover:text-foreground absolute right-3 top-3 inline-flex size-8 items-center justify-center rounded-md transition-colors focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                aria-label="Modalı kapat"
              >
                <X className="size-4" aria-hidden />
              </button>
            ) : null}
            <CardTitle>
              {variant === "dashboard"
                ? "Çarpan ve yenilenme ayarı"
                : "Çarpan sayısı belirleme"}
            </CardTitle>
            <p className="text-muted-foreground text-sm">
              {variant === "dashboard" ? (
                <>
                  Dashboard hesaplamaları için <b>tam sayı</b> girin.
                </>
              ) : (
                <>
                  Dashboard hesaplamaları için <b>tam sayı</b> girin. Çıkış/iptal
                  mümkün değil.
                </>
              )}
            </p>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <label htmlFor="multiplier" className="text-sm font-medium">
                Çarpan
              </label>
              <input
                id="multiplier"
                inputMode="numeric"
                type="text"
                className={inputClass}
                value={rawMultiplier}
                onChange={(e) => {
                  const val = e.target.value;
                  // Sadece rakamları kabul et (0-9)
                  if (val === "" || /^\d+$/.test(val)) {
                    setRawMultiplier(val);
                    if (error) setError(null);
                  }
                }}
                required
              />
              {error ? (
                <p className="text-destructive text-xs" role="alert">
                  {error}
                </p>
              ) : (
                <p className="text-muted-foreground text-xs">
                  Sadece tam sayı kabul edilir.
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <label
                htmlFor="refreshIntervalSeconds"
                className="text-sm font-medium"
              >
                Yenilenme süresi (saniye)
              </label>
              <input
                id="refreshIntervalSeconds"
                inputMode="numeric"
                type="text"
                className={inputClass}
                value={rawRefreshSeconds}
                onChange={(e) => {
                  const val = e.target.value;
                  // Sadece rakamları kabul et (0-9)
                  if (val === "" || /^\d+$/.test(val)) {
                    setRawRefreshSeconds(val);
                    if (error) setError(null);
                  }
                }}
                required
              />
              <p className="text-muted-foreground text-xs">
                Örn: <b>30</b> yazarsanız 30 saniyede bir veri yeniler.
              </p>
            </div>

            <button
              type="button"
              className={buttonClass}
              onClick={() => {
                console.log("[MultiplierSetupModal] Button 'Kaydet ve devam et' CLICKED");
                console.log("[MultiplierSetupModal] Current raw inputs -> Multiplier:", rawMultiplier, "RefreshSeconds:", rawRefreshSeconds);
                console.log("[MultiplierSetupModal] Parsed values -> Multiplier:", parsedMultiplier, "RefreshSeconds:", parsedRefreshSeconds);

                if (parsedMultiplier === null || parsedRefreshSeconds === null) {
                  const reason = parsedMultiplier === null ? "Invalid Multiplier" : "Invalid Refresh Seconds";
                  console.error("[MultiplierSetupModal] VALIDATION ERROR:", reason);
                  setError(`Hata: ${reason}. Lütfen geçerli bir tam sayı girin.`);
                  return;
                }

                console.log("[MultiplierSetupModal] Validation PASSED. Calling onSave...");
                try {
                  onSave({
                    multiplier: parsedMultiplier,
                    refreshIntervalSeconds: parsedRefreshSeconds,
                  });
                  console.log("[MultiplierSetupModal] onSave callback executed SUCCESSFULLY.");
                } catch (saveError) {
                  console.error("[MultiplierSetupModal] CRITICAL ERROR during onSave callback:", saveError);
                  setError("Bir hata oluştu. Lütfen tekrar deneyin.");
                }
              }}
            >
              Kaydet ve devam et
            </button>
            {variant === "dashboard" ? (
              <Link
                href="/auth/sign-out"
                onClick={() => clearAuthLocalStorage()}
                className="inline-flex h-10 w-full items-center justify-center gap-2 whitespace-nowrap rounded-md border border-border bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground transition-all hover:bg-secondary/80 focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
              >
                Hesaptan çıkış yap
              </Link>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

