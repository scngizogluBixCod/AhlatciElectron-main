"use client";

import { useEffect } from "react";

/**
 * Electron ortamında Esc tuşu ile tam ekran modunu toggle eder.
 * Tarayıcıda çalışırken hiçbir şey render etmez / yapmaz.
 */
export function ElectronShell() {
  useEffect(() => {
    const api = window.electronAPI;
    if (!api?.isElectron) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        api?.toggleFullscreen?.();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return null;
}

import { Minus, X } from "lucide-react";

/**
 * Electron pencere kontrol butonları (minimize / kapat).
 * Global root layout'ta kullanılmak üzere tasarlandı.
 */
export function ElectronWindowControls() {
  const isElectron =
    typeof window !== "undefined" && !!window.electronAPI?.isElectron;
  if (!isElectron) return null;

  return (
    <div className="electron-titlebar">
      <div className="electron-titlebar-title">Ahlatcı Dashboard</div>
      <div className="electron-window-controls">
        <button
          type="button"
          className="electron-window-button"
          aria-label="Pencereyi aşağı al"
          onClick={() => window.electronAPI?.minimizeWindow?.()}
        >
          <Minus />
        </button>
        <button
          type="button"
          className="electron-window-button electron-window-button-close"
          aria-label="Pencereyi kapat"
          onClick={() => window.electronAPI?.closeWindow?.()}
        >
          <X />
        </button>
      </div>
    </div>
  );
}
