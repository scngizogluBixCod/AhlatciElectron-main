/**
 * Next.js standalone çıktısına `.next/static` ve `public` kopyalar (üretim sunucusu için gerekli).
 * @see https://nextjs.org/docs/app/api-reference/config/next-config-js/output
 */
import { createHash } from "node:crypto";
import {
  cpSync, existsSync, mkdirSync, readFileSync, readdirSync, renameSync,
  statSync, writeFileSync,
} from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * electron-builder, extraResources kopyalarken `node_modules` adlı klasörleri
 * otomatik olarak hariç tutar. Standalone içindeki node_modules'ları `_modules`
 * olarak yeniden adlandırıyoruz; runtime'da (electron/main.js) geri çevriliyor.
 *
 * Bu sabiti artırırsanız Electron tarafındaki eşleşen sabiti de artırın.
 * main.js'teki STANDALONE_COPY_REVISION ile aynı değer olmalıdır; farklıysa
 * Electron eski önbelleği siler ve yenisini oluşturur.
 */
const STANDALONE_COPY_REVISION = 2;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const nextDir = path.join(root, ".next");
const standaloneDir = path.join(nextDir, "standalone");
const staticSrc = path.join(nextDir, "static");
const staticDest = path.join(standaloneDir, ".next", "static");
const publicSrc = path.join(root, "public");
const publicDest = path.join(standaloneDir, "public");

if (!existsSync(path.join(standaloneDir, "server.js"))) {
  console.error(
    "prepare-standalone: .next/standalone/server.js yok. Önce `npm run build` çalıştırın.",
  );
  process.exit(1);
}

mkdirSync(path.dirname(staticDest), { recursive: true });
cpSync(staticSrc, staticDest, { recursive: true });

if (existsSync(publicSrc)) {
  cpSync(publicSrc, publicDest, { recursive: true });
}

/**
 * Next üretim sunucusu cwd = standalone; .env* burada olmalı.
 * Öncelik: üretim dosyaları (.env.production*) — geliştirme .env.local yalnızca yedek.
 */
const envNames = [
  ".env.production.local",
  ".env.production",
  ".env.local",
  ".env",
];
let envCopied = 0;
let hasProdEnv = false;
for (const name of envNames) {
  const src = path.join(root, name);
  if (!existsSync(src)) continue;
  if (name === ".env.production.local" || name === ".env.production") {
    hasProdEnv = true;
  }
  cpSync(src, path.join(standaloneDir, name));
  envCopied += 1;
  console.log(`prepare-standalone: ${name} standalone köküne kopyalandı.`);
}
if (envCopied === 0) {
  console.warn(
    "prepare-standalone: Ortam dosyası yok. Örnek: cp .env.production.example .env.production",
  );
} else if (!hasProdEnv) {
  console.warn(
    "prepare-standalone: Üretim için .env.production veya .env.production.local kullanman önerilir; şu an yalnızca geliştirme dosyası kopyalandı.",
  );
}

console.log("prepare-standalone: static ve public standalone içine kopyalandı.");

/**
 * node_modules → _modules yeniden adlandırma.
 * electron-builder "all files" filtresi olsa bile node_modules'ları atlar.
 * Recursive olarak tüm ağacı tarar.
 */
function renameNodeModulesDeep(dir) {
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry);
    let stat;
    try {
      stat = statSync(full);
    } catch {
      continue;
    }
    if (!stat.isDirectory()) continue;

    if (entry === "node_modules") {
      const renamed = path.join(dir, "_modules");
      renameSync(full, renamed);
      console.log(`prepare-standalone: node_modules → _modules: ${path.relative(standaloneDir, renamed)}`);
      // Yeniden adlandırılan klasörün alt ağacını da tara
      renameNodeModulesDeep(renamed);
    } else {
      renameNodeModulesDeep(full);
    }
  }
}

renameNodeModulesDeep(standaloneDir);
console.log("prepare-standalone: tüm node_modules klasörleri _modules olarak yeniden adlandırıldı.");

/** Electron: paket içi kopya ile userData önbelleğini ayırt etmek için (her build benzersiz). */
const serverJsPath = path.join(standaloneDir, "server.js");
let serverSha = "";
if (existsSync(serverJsPath)) {
  serverSha = createHash("sha256")
    .update(readFileSync(serverJsPath))
    .digest("hex");
}
const stamp = [
  new Date().toISOString(),
  serverSha,
  `copy-rev:${STANDALONE_COPY_REVISION}`,
  Math.random().toString(36).slice(2),
].join("\n") + "\n";
writeFileSync(path.join(standaloneDir, ".electron-prepare-stamp"), stamp, "utf8");
console.log("prepare-standalone: .electron-prepare-stamp yazıldı (Electron önbellek doğrulaması).");
