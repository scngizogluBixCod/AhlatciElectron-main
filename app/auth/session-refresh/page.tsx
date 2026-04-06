"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { clearAuthLocalStorage } from "@/lib/auth-client-cleanup";
import {
  getStoredRefreshToken,
  setStoredRefreshToken,
} from "@/lib/auth-refresh-storage";

function SessionRefreshInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/";
  const [error, setError] = useState<string | null>(null);
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    let cancelled = false;

    async function run() {
      const rt = getStoredRefreshToken();
      if (!rt) {
        router.replace(`/auth/login?from=${encodeURIComponent(next)}`);
        return;
      }

      try {
        const res = await fetch("/api/auth/refresh", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken: rt }),
        });

        const data = (await res.json().catch(() => null)) as {
          success?: boolean;
          refreshToken?: string;
        } | null;

        if (!res.ok || !data?.success) {
          clearAuthLocalStorage();
          await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
          if (!cancelled) {
            router.replace(`/auth/login?from=${encodeURIComponent(next)}`);
          }
          return;
        }

        if (typeof data.refreshToken === "string") {
          setStoredRefreshToken(data.refreshToken);
        }

        if (!cancelled) {
          router.replace(next);
        }
      } catch {
        if (!cancelled) {
          setError("Oturum yenilenemedi. Yönlendiriliyorsunuz…");
          clearAuthLocalStorage();
          await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
          router.replace(`/auth/login?from=${encodeURIComponent(next)}`);
        }
      }
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [router, next]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-2 p-6 text-center">
      <p className="text-muted-foreground text-sm">Oturum yenileniyor…</p>
      {error ? (
        <p className="text-destructive text-sm">{error}</p>
      ) : null}
    </div>
  );
}

export default function SessionRefreshPage() {
  return (
    <Suspense
      fallback={
        <div className="text-muted-foreground flex min-h-screen items-center justify-center text-sm">
          Yükleniyor…
        </div>
      }
    >
      <SessionRefreshInner />
    </Suspense>
  );
}
