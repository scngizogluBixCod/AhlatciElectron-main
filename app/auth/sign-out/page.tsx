"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { clearAuthLocalStorage } from "@/lib/auth-client-cleanup";

/**
 * Sunucu bileşenleri 401 sonrası buraya yönlendirir; refresh token (localStorage)
 * temizlenir, ardından çerezler /api/auth/logout ile silinir.
 */
export default function SignOutPage() {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    async function run() {
      clearAuthLocalStorage();
      try {
        // API GET redirect'ine güvenmek yerine Set-Cookie'i almak için POST kullanalım.
        await fetch("/api/auth/logout", { method: "POST", cache: "no-store" });
      } catch (error) {
        console.error("[SignOut] /api/auth/logout POST başarısız", error);
      } finally {
        if (!cancelled) router.replace("/auth/login");
      }
    }

    void run();

    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <div className="text-muted-foreground flex min-h-screen items-center justify-center text-sm">
      Çıkış yapılıyor…
    </div>
  );
}
