"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  verifyLoginOtpAction,
  type VerifyOtpResult,
} from "@/app/auth/actions";
import { setStoredRefreshToken } from "@/lib/auth-refresh-storage";
import {
  getStoredMarketplaceMultiplier,
  setStoredMarketplaceMultiplier,
} from "@/lib/marketplace-multiplier-storage";
import {
  getStoredMarketplaceRefreshIntervalSeconds,
  setStoredMarketplaceRefreshIntervalSeconds,
} from "@/lib/marketplace-refresh-interval-storage";
import { MultiplierSetupModal } from "@/components/MultiplierSetupModal";

const inputClass =
  "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-center text-lg tracking-[0.5em] shadow-xs transition-[color,box-shadow] outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]";

const buttonClass =
  "inline-flex h-9 w-full items-center justify-center gap-2 whitespace-nowrap rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90 focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50";

type OTPFormProps = React.ComponentProps<typeof Card> & {
  initialSuccessMessage?: string;
};

export function OTPForm({ initialSuccessMessage, ...props }: OTPFormProps) {
  const [code, setCode] = useState("");
  const router = useRouter();
  const otpHandledRef = useRef(false);
  const [state, formAction] = useActionState<VerifyOtpResult | null, FormData>(
    verifyLoginOtpAction,
    null,
  );

  const shouldShowMultiplierModal =
    !!state?.success && "refreshToken" in state
      ? getStoredMarketplaceMultiplier() === null ||
        getStoredMarketplaceRefreshIntervalSeconds() === null ||
        (getStoredMarketplaceRefreshIntervalSeconds() ?? 0) <= 0
      : false;

  useEffect(() => {
    if (state && !state.success) {
      otpHandledRef.current = false;
    }
  }, [state]);

  useEffect(() => {
    if (!state?.success || !("refreshToken" in state)) return;
    if (otpHandledRef.current) return;
    otpHandledRef.current = true;
    setStoredRefreshToken(state.refreshToken);
    const nextUrl = state.redirectTo;

    const storedMultiplier = getStoredMarketplaceMultiplier();
    const storedRefreshIntervalSeconds =
      getStoredMarketplaceRefreshIntervalSeconds();

    if (
      storedMultiplier !== null &&
      storedRefreshIntervalSeconds !== null &&
      storedRefreshIntervalSeconds > 0
    ) {
      router.replace(nextUrl);
      return;
    }
  }, [state, router]);

  return (
    <>
      <MultiplierSetupModal
        open={shouldShowMultiplierModal}
        onSave={({ multiplier, refreshIntervalSeconds }) => {
          setStoredMarketplaceMultiplier(multiplier);
          setStoredMarketplaceRefreshIntervalSeconds(refreshIntervalSeconds);
          if (!state?.success || !("refreshToken" in state)) return;
          router.replace(state.redirectTo);
        }}
      />
      <Card {...props}>
        <CardHeader>
          <CardTitle>Doğrulama kodu</CardTitle>
          <p className="text-muted-foreground text-sm">
            E-posta veya telefonunuza gönderilen 6 haneli kodu girin.
          </p>
          {initialSuccessMessage ? (
            <p className="text-success text-sm">{initialSuccessMessage}</p>
          ) : null}
        </CardHeader>
        <CardContent>
          <form action={formAction} className="flex flex-col gap-6">
            <input type="hidden" name="code" value={code} readOnly />
            <div className="flex flex-col gap-2">
              <label htmlFor="otp" className="text-sm font-medium">
                Kod
              </label>
              <input
                id="otp"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]*"
                maxLength={6}
                value={code}
                onChange={(e) =>
                  setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                required
                className={cn(inputClass)}
                placeholder="••••••"
              />
              <p className="text-muted-foreground text-xs">
                6 haneli sayısal kodu girin.
              </p>
            </div>
            {state && !state.success ? (
              <p
                className="text-destructive text-center text-sm"
                role="alert"
              >
                {state.error}
              </p>
            ) : null}
            <button type="submit" className={buttonClass}>
              Doğrula
            </button>
            <p className="text-muted-foreground text-center text-xs">
              Kod gelmedi mi?{" "}
              <a href="/auth/login" className="text-primary underline">
                Tekrar giriş yap
              </a>
            </p>
          </form>
        </CardContent>
      </Card>
    </>
  );
}
