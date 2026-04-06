"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { loginAction, type LoginResult } from "@/app/auth/actions";
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
  "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]";

const buttonClass =
  "inline-flex h-9 w-full items-center justify-center gap-2 whitespace-nowrap rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90 focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50";

export function LoginForm({
  className,
  from,
  ...props
}: React.ComponentProps<"div"> & { from?: string }) {
  const router = useRouter();

  const [state, formAction] = useActionState<LoginResult | null, FormData>(
    loginAction,
    null,
  );
  const [showPassword, setShowPassword] = useState(false);
  const loginHandledRef = useRef(false);
  const [multiplierSaved, setMultiplierSaved] = useState(false);

  const shouldShowMultiplierModal =
    !!state?.success && "refreshToken" in state && !multiplierSaved
      ? getStoredMarketplaceMultiplier() === null ||
        getStoredMarketplaceRefreshIntervalSeconds() === null ||
        (getStoredMarketplaceRefreshIntervalSeconds() ?? 0) <= 0
      : false;

  useEffect(() => {
    if (state && !state.success) {
      loginHandledRef.current = false;
    }
  }, [state]);

  useEffect(() => {
    if (!state?.success || !("refreshToken" in state)) return;
    if (loginHandledRef.current) return;
    loginHandledRef.current = true;
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
      console.log("[Login] Navigating directly to:", nextUrl);
      router.replace(nextUrl);
      return;
    }
  }, [state, router]);

  return (
    <div className={cn("flex min-w-0 flex-col gap-6", className)} {...props}>
      <MultiplierSetupModal
        open={shouldShowMultiplierModal}
        onSave={({ multiplier, refreshIntervalSeconds }) => {
          console.log("[Login] onSave triggered. Multiplier:", multiplier, "Interval:", refreshIntervalSeconds);
          try {
            setStoredMarketplaceMultiplier(multiplier);
            setStoredMarketplaceRefreshIntervalSeconds(refreshIntervalSeconds);
            setMultiplierSaved(true);
            console.log("[Login] Values stored in localStorage successfully.");

            if (!state?.success || !("refreshToken" in state)) {
              console.warn("[Login] Cannot continue: state successful is false or refreshToken missing.", state);
              return;
            }
            console.log("[Login] Moving to target URL:", state.redirectTo);
            router.replace(state.redirectTo);
          } catch (err) {
            console.error("[Login] Error during onSave execution:", err);
          }
        }}
      />
      <Card className="min-w-0 overflow-hidden p-0">
        <CardContent className="min-w-0 p-0">
          <form
            className="flex min-w-0 flex-col justify-center gap-7 p-4 sm:p-6 md:p-8"
            action={formAction}
          >
            {from ? <input type="hidden" name="from" value={from} /> : null}
            <div className="flex flex-col items-center gap-2 text-center">
              <h1 className="text-2xl font-bold">Giriş yap</h1>
              <p className="text-muted-foreground text-balance text-sm">
                E-posta ve şifrenizle oturum açın.
              </p>
            </div>
            {state && !state.success ? (
              <p className="text-destructive text-center text-sm" role="alert">
                {state.error}
              </p>
            ) : null}
            <div className="flex flex-col gap-2">
              <label htmlFor="email" className="text-sm font-medium">
                E-posta
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="ornek@site.com"
                required
                className={inputClass}
              />
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex items-center">
                <label htmlFor="password" className="text-sm font-medium">
                  Şifre
                </label>
              </div>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  className={cn(inputClass, "pr-10")}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="text-muted-foreground hover:bg-muted hover:text-foreground absolute right-2 top-1/2 -translate-y-1/2 rounded p-1.5 focus:ring-ring focus:outline-none focus:ring-2"
                  aria-label={showPassword ? "Şifreyi gizle" : "Şifreyi göster"}
                >
                  {showPassword ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>
              </div>
            </div>
            <button type="submit" className={buttonClass}>
              Giriş yap
            </button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
