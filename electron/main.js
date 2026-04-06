const { app, BrowserWindow, dialog, ipcMain, Menu, shell } = require("electron");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const { spawn, execSync } = require("child_process");
const http = require("http");

/** `prepare-standalone` her çalışmada yazar; DMG yenilense de aynı app version ile önbellek eşleşmez. */
const PREPARE_STAMP = ".electron-prepare-stamp";

/**
 * prepare-standalone.mjs'deki STANDALONE_COPY_REVISION ile aynı olmalı.
 * Artırıldığında Electron eski userData kopyasını siler ve yeniden kopyalar.
 */
const STANDALONE_COPY_REVISION = 2;

/**
 * prepare-standalone.mjs node_modules → _modules olarak paketler
 * (electron-builder node_modules'ları otomatik hariç tutar).
 * Bu fonksiyon runtime'da _modules → node_modules geri çevirir.
 */
function restoreNodeModulesDeep(dir) {
  let entries;
  try {
    entries = fs.readdirSync(dir);
  } catch {
    return;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry);
    let stat;
    try {
      stat = fs.statSync(full);
    } catch {
      continue;
    }
    if (!stat.isDirectory()) continue;
    if (entry === "_modules") {
      const restored = path.join(dir, "node_modules");
      fs.renameSync(full, restored);
      debugLog("[electron] _modules → node_modules:", path.relative(dir, restored));
      restoreNodeModulesDeep(restored);
    } else {
      restoreNodeModulesDeep(full);
    }
  }
}

function sha256File(filePath) {
  try {
    return crypto
      .createHash("sha256")
      .update(fs.readFileSync(filePath))
      .digest("hex");
  } catch {
    return null;
  }
}

/** Paketli DMG/.app: konsol çıktısı yok; hatalar buraya yazılır. */
function getDebugLogPath() {
  return path.join(app.getPath("userData"), "ahlatci-debug.log");
}

function debugLog(...parts) {
  const text = parts
    .map((p) =>
      typeof p === "object" && p !== null && !(p instanceof Error)
        ? JSON.stringify(p)
        : p instanceof Error
          ? p.stack || p.message
          : String(p),
    )
    .join(" ");
  const line = `[${new Date().toISOString()}] ${text}\n`;
  try {
    if (app.isReady()) {
      fs.appendFileSync(getDebugLogPath(), line, "utf8");
    }
  } catch {
    /* ignore */
  }
  console.error("[ahlatci]", ...parts);
}

function installApplicationMenu() {
  const isMac = process.platform === "darwin";
  /** @type {Electron.MenuItemConstructorOptions[]} */
  const template = [
    ...(isMac
      ? [
          {
            label: app.name,
            submenu: [
              { role: "about" },
              { type: "separator" },
              { role: "services" },
              { type: "separator" },
              { role: "hide" },
              { role: "hideOthers" },
              { role: "unhide" },
              { type: "separator" },
              { role: "quit" },
            ],
          },
        ]
      : []),
    {
      label: "Görünüm",
      submenu: [
        { role: "reload" },
        { role: "forceReload" },
        { type: "separator" },
        {
          label: "Geliştirici Araçları",
          accelerator: isMac ? "Alt+Command+I" : "Ctrl+Shift+I",
          role: "toggleDevTools",
        },
        { type: "separator" },
        { role: "resetZoom" },
        { role: "zoomIn" },
        { role: "zoomOut" },
      ],
    },
    {
      label: "Yardım",
      submenu: [
        {
          label: "Hata günlüğünü göster (Finder)",
          click: () => {
            const logPath = getDebugLogPath();
            if (!fs.existsSync(logPath)) {
              fs.writeFileSync(logPath, "", "utf8");
            }
            shell.showItemInFolder(logPath);
          },
        },
        {
          label: "Kullanıcı verisi klasörünü aç",
          click: () => {
            shell.openPath(app.getPath("userData"));
          },
        },
      ],
    },
  ];
  if (!isMac) {
    template.unshift({
      label: "Dosya",
      submenu: [{ role: "quit" }],
    });
  }
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

/** Yalnızca paketlenmiş uygulama (.app / .exe): yerel geliştirme sunucularıyla aynı porta bağlanmaz. */
const PACKAGED_NEXT_PORT = "38491";

function getPort() {
  if (process.env.PORT) return String(process.env.PORT);
  // Paket: daima ayrı port. Kaynak koddan çalışan Electron (isPackaged=false): yerel 3000.
  if (app.isPackaged) return PACKAGED_NEXT_PORT;
  return "3000";
}

function getStartUrl() {
  return `http://127.0.0.1:${getPort()}`;
}

/** @type {import('child_process').ChildProcess | null} */
let nextChild = null;
/** @type {import('electron').BrowserWindow | null} */
let mainWindow = null;

function shouldUseFullscreenForUrl(rawUrl) {
  return true;
}

function syncFullscreenWithRoute(win, rawUrl) {
  if (!win || win.isDestroyed()) return;
  const nextFullscreen = shouldUseFullscreenForUrl(rawUrl);
  if (win.isFullScreen() !== nextFullscreen) {
    win.setFullScreen(nextFullscreen);
  }
}

/**
 * Next standalone kökü: geliştirmede repo içi; paketlenmiş uygulamada extraResources.
 *
 * macOS .app içindeki Resources genelde salt okunur; Next üretim sunucusu .next/cache vb.
 * yazmak isteyebilir. Bu yüzden paketli sürümde bundle'ı userData altına kopyalıyoruz.
 *
 * Aynı uygulama sürümü (ör. 0.1.0) ile yeni DMG yüklendiğinde eski önbellek kullanılmamalı:
 * `prepare-standalone` damgası veya (eski paketlerde) `server.js` içeriği farklıysa kopya yenilenir.
 */
function getStandaloneDir() {
  if (!app.isPackaged) {
    return path.join(__dirname, "..", ".next", "standalone");
  }
  const src = path.join(process.resourcesPath, "next");
  const dest = path.join(
    app.getPath("userData"),
    "next-standalone",
    app.getVersion(),
  );
  const srcStamp = path.join(src, PREPARE_STAMP);
  const destStamp = path.join(dest, PREPARE_STAMP);
  const srcServer = path.join(src, "server.js");
  const destServer = path.join(dest, "server.js");

  let needCopy = true;
  if (fs.existsSync(destServer)) {
    if (fs.existsSync(srcStamp) && fs.existsSync(destStamp)) {
      try {
        if (
          fs.readFileSync(srcStamp, "utf8") === fs.readFileSync(destStamp, "utf8")
        ) {
          needCopy = false;
        }
      } catch {
        needCopy = true;
      }
    } else if (fs.existsSync(srcServer) && fs.existsSync(destServer)) {
      const a = sha256File(srcServer);
      const b = sha256File(destServer);
      if (a && b && a === b) {
        needCopy = false;
      }
    }

    // Ek kontrol: Eğer server.js var ama node_modules yoksa kopyalamayı zorla
    if (!needCopy && !fs.existsSync(path.join(dest, "node_modules")) && !fs.existsSync(path.join(dest, "_modules"))) {
      debugLog("[electron] Sunucu dosyası var ama node_modules eksik, kopyalama zorlanıyor.");
      needCopy = true;
    }
  }

  if (needCopy) {
    debugLog("[electron] Next standalone kopyalanıyor (ilk kurulum veya yeni build)…", dest);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    if (fs.existsSync(dest)) {
      fs.rmSync(dest, { recursive: true, force: true });
    }

    // Windows'ta fs.cpSync scoped paketlerde (@hapi vb.) ENOENT verir;
    // robocopy çok daha güvenilir. Ancak PATH'te system32 olmayabilir,
    // bu yüzden tam yoldan çağırıyoruz + fallback.
    if (process.platform === "win32") {
      const system32 = path.join(process.env.SystemRoot || "C:\\WINDOWS", "system32");
      const robocopyExe = path.join(system32, "robocopy.exe");
      let robocopyOk = false;
      if (fs.existsSync(robocopyExe)) {
        try {
          execSync(
            `"${robocopyExe}" "${src}" "${dest}" /MIR /R:1 /W:1 /NFL /NDL /NJH /NJS`,
            { stdio: "pipe", windowsHide: true },
          );
          robocopyOk = true;
        } catch (e) {
          // robocopy çıkış kodları: 0-7 başarı, >=8 hata
          if (typeof e.status === "number" && e.status < 8) {
            robocopyOk = true;
          } else {
            debugLog("[electron] robocopy başarısız, fs.cpSync fallback kullanılıyor:", e.message);
          }
        }
      } else {
        debugLog("[electron] robocopy.exe bulunamadı, fs.cpSync fallback kullanılıyor");
      }
      if (!robocopyOk) {
        fs.cpSync(src, dest, { recursive: true, dereference: true, force: true });
      }
    } else if (process.platform === "darwin") {
      try {
        // macOS'ta cp -R, fs.cpSync'den çok daha güvenilir ve hızlıdır.
        // Kaynak sonuna / koyarak içeriği kopyalıyoruz.
        execSync(`cp -R "${src}/" "${dest}"`, { stdio: "pipe" });
        debugLog("[electron] cp -R (macOS) ile kopyalama başarılı.");
      } catch (e) {
        debugLog("[electron] cp -R başarısız, fallback fs.cpSync:", e.message);
        fs.cpSync(src, dest, { recursive: true });
      }
    } else {
      fs.cpSync(src, dest, { recursive: true });
    }

    // prepare-standalone.mjs _modules olarak adlandırdı; geri çevir.
    restoreNodeModulesDeep(dest);

    fs.writeFileSync(
      path.join(dest, ".electron-standalone-ready"),
      `${new Date().toISOString()}\ncopy-rev:${STANDALONE_COPY_REVISION}\n`,
      "utf8",
    );
    debugLog("[electron] Next bundle hazır.");
  }
  return dest;
}

function waitForServer(url, maxMs = 90000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const tick = () => {
      http
        .get(url, (res) => {
          res.resume();
          resolve();
        })
        .on("error", () => {
          if (Date.now() - start > maxMs) {
            reject(new Error(`Server did not become ready: ${url}`));
            return;
          }
          setTimeout(tick, 400);
        });
    };
    tick();
  });
}

function startNextProduction() {
  const standaloneDir = getStandaloneDir();
  const serverJs = path.join(standaloneDir, "server.js");
  if (!fs.existsSync(serverJs)) {
    console.error(
      "Next standalone bulunamadı:",
      serverJs,
      "Önce `npm run build` ve `npm run prepare:standalone` çalıştırın.",
    );
    return Promise.reject(
      new Error(`Missing Next standalone server: ${serverJs}`),
    );
  }
  // Electron ikilisi Node ile aynı API'yi kullanır; ayrı Node kurulumu gerekmez.
  const port = getPort();
  const env = {
    ...process.env,
    NODE_ENV: "production",
    ELECTRON_RUN_AS_NODE: "1",
    PORT: port,
    TMPDIR: app.getPath("temp"),
  };
  const useStdioPipe = app.isPackaged;
  nextChild = spawn(process.execPath, [serverJs], {
    cwd: standaloneDir,
    env,
    stdio: useStdioPipe ? ["ignore", "pipe", "pipe"] : "inherit",
  });
  if (useStdioPipe && nextChild.stdout) {
    nextChild.stdout.on("data", (buf) =>
      debugLog("[next stdout]", buf.toString()),
    );
  }
  if (useStdioPipe && nextChild.stderr) {
    nextChild.stderr.on("data", (buf) =>
      debugLog("[next stderr]", buf.toString()),
    );
  }
  nextChild.on("error", (err) => {
    debugLog("failed to start Next standalone server:", err);
  });
  nextChild.on("exit", (code, signal) => {
    if (code === 0 || code === null) return;
    debugLog("[electron] Next sunucusu kapandı", { code, signal });
  });
  return waitForServer(getStartUrl());
}

async function ensureProdServer() {
  // DMG/.app çalıştırıldığında NODE_ENV genelde set değildir; paketlenmiş sürümde her zaman Next gerekir.
  const needProdServer =
    app.isPackaged || process.env.NODE_ENV === "production";
  if (!needProdServer) return;
  if (nextChild && !nextChild.killed) {
    await waitForServer(getStartUrl());
    return;
  }
  await startNextProduction();
}

async function createWindow() {
  await ensureProdServer();

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    show: false,
    fullscreen: true,
    backgroundColor: "#171923",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
  });

  mainWindow.webContents.on("did-fail-load", (_event, code, desc, url) => {
    debugLog("[electron] did-fail-load", { code, desc, url });
    dialog.showErrorBox(
      "Sayfa yüklenemedi",
      `${desc}\nKod: ${code}\n${url}`,
    );
  });

  mainWindow.webContents.on("did-navigate", (_event, url) => {
    syncFullscreenWithRoute(mainWindow, url);
  });

  mainWindow.webContents.on("did-navigate-in-page", (_event, url) => {
    syncFullscreenWithRoute(mainWindow, url);
  });

  await mainWindow.loadURL(getStartUrl());
  syncFullscreenWithRoute(mainWindow, mainWindow.webContents.getURL());

  mainWindow.focus();
  if (process.platform === "darwin") {
    app.focus({ steal: true });
  }

  if (process.env.NODE_ENV === "development") {
    mainWindow.webContents.openDevTools({ mode: "detach" });
  }
}

function killNextChild() {
  if (nextChild && !nextChild.killed) {
    nextChild.kill(process.platform === "win32" ? undefined : "SIGTERM");
    nextChild = null;
  }
}

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
      if (process.platform === "darwin") app.focus({ steal: true });
    }
  });

  app.on("window-all-closed", () => {
    killNextChild();
    if (process.platform !== "darwin") {
      app.quit();
    }
  });

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow().catch((err) => {
        debugLog("createWindow (activate):", err);
        dialog.showErrorBox(
          "Ahlatci başlatılamadı",
          err instanceof Error ? err.message : String(err),
        );
      });
    }
  });

  app.on("before-quit", () => {
    killNextChild();
  });

  app.whenReady().then(() => {
    try {
      fs.appendFileSync(
        getDebugLogPath(),
        `\n${"=".repeat(60)}\n${new Date().toISOString()} oturum başladı (v${app.getVersion()})\n`,
        "utf8",
      );
    } catch {
      /* ignore */
    }
    installApplicationMenu();

    ipcMain.on("toggle-fullscreen", () => {
      if (!mainWindow || mainWindow.isDestroyed()) return;
      mainWindow.setFullScreen(!mainWindow.isFullScreen());
    });
    ipcMain.on("minimize-window", () => {
      if (!mainWindow || mainWindow.isDestroyed()) return;
      mainWindow.minimize();
    });
    ipcMain.on("close-window", () => {
      if (!mainWindow || mainWindow.isDestroyed()) return;
      mainWindow.close();
    });

    createWindow().catch((err) => {
      debugLog("createWindow:", err);
      dialog.showErrorBox(
        "Ahlatci başlatılamadı",
        err instanceof Error ? err.message : String(err),
      );
      killNextChild();
      app.quit();
    });
  });
}
