/**
 * Windows Electron build wrapper.
 *
 * electron-builder dahili olarak `cmd.exe` kullanır (shell: true ile spawn).
 * Bazı ortamlarda %SystemRoot%\system32 PATH'e resolve edilmemiş olabiliyor;
 * bu durumda cmd.exe bulunamaz ve "No JSON content found in output" hatası alınır.
 *
 * Bu script:
 *  1. PATH'e C:\WINDOWS\system32 ekler (yoksa)
 *  2. next build çalıştırır
 *  3. prepare:standalone çalıştırır
 *  4. CSC_IDENTITY_AUTO_DISCOVERY=false ile electron-builder çalıştırır
 */
import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";

// ── PATH düzeltmesi ──────────────────────────────────────────────
const system32 = path.join(process.env.SystemRoot || "C:\\WINDOWS", "system32");
if (!process.env.PATH.toLowerCase().includes(system32.toLowerCase())) {
  process.env.PATH = `${system32};${process.env.PATH}`;
  console.log(`[build-win] PATH'e eklendi: ${system32}`);
}

// cmd.exe erişim kontrolü
const cmdExe = path.join(system32, "cmd.exe");
if (!existsSync(cmdExe)) {
  console.error(`[build-win] HATA: cmd.exe bulunamadı: ${cmdExe}`);
  process.exit(1);
}

// ── Build adımları ───────────────────────────────────────────────
const steps = [
  { label: "next build", cmd: "npm run build" },
  { label: "prepare:standalone", cmd: "npm run prepare:standalone" },
  {
    label: "electron-builder",
    cmd: "npx electron-builder --win --x64 --publish never",
    env: { CSC_IDENTITY_AUTO_DISCOVERY: "false" },
  },
];

for (const step of steps) {
  console.log(`\n${"─".repeat(60)}\n[build-win] ${step.label}\n${"─".repeat(60)}`);
  try {
    execSync(step.cmd, {
      stdio: "inherit",
      env: { ...process.env, ...step.env },
      cwd: path.resolve(import.meta.dirname, ".."),
    });
  } catch (e) {
    console.error(`[build-win] "${step.label}" başarısız (exit ${e.status})`);
    process.exit(e.status || 1);
  }
}

console.log("\n[build-win] ✅ Build tamamlandı! → dist/ klasörüne bakın.");
