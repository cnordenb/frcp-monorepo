import { app, BrowserWindow, ipcMain, Menu, net, protocol, session, shell } from "electron";
import type { DownloadItem, IpcMainEvent, WebContents } from "electron";
import { dirname, join, normalize, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { PASS_CLICKS_CHANNEL, QUIT_CHANNEL } from "./desktop-bridge.ts";

const HERE = dirname(fileURLToPath(import.meta.url));
const SITE_SCHEME = "frcp";
const OWN_PAGES = `${SITE_SCHEME}://app/`;
const SITE_PRIVILEGES = { standard: true, secure: true, supportFetchAPI: true, stream: true };
const WINDOW_ICON = join(HERE, "assets", "launcher", "frcp_desktop.ico");
const TITLE = "Fresh Random Civ Picker";
const PARCHMENT = { width: 578, height: 605 };
const LARGEST_DIALOG = { width: 900, height: 560 };
const PAGE_MARGIN = 16;
const CONTENT = {
  width: Math.max(PARCHMENT.width, LARGEST_DIALOG.width) + 2 * PAGE_MARGIN,
  height: Math.max(PARCHMENT.height, LARGEST_DIALOG.height) + 2 * PAGE_MARGIN,
};
const OUTSIDE_PROTOCOLS = ["https:", "aoe2de:"];

function protocolOf(url: string): string {
  try {
    return new URL(url).protocol;
  } catch {
    return "";
  }
}

function openOutside(url: string): void {
  if (OUTSIDE_PROTOCOLS.includes(protocolOf(url))) void shell.openExternal(url);
}

function keepLinksOutside(contents: WebContents): void {
  contents.setWindowOpenHandler(({ url }) => {
    openOutside(url);
    return { action: "deny" };
  });
  contents.on("will-navigate", (event, url) => {
    if (url.startsWith(OWN_PAGES)) return;
    event.preventDefault();
    openOutside(url);
  });
}

function siteFile(url: string): string | null {
  const wanted = decodeURIComponent(new URL(url).pathname);
  const file = normalize(join(HERE, wanted.endsWith("/") ? `${wanted}index.html` : wanted));
  return file.startsWith(HERE + sep) ? file : null;
}

function notFound(): Response {
  return new Response("Not found", { status: 404 });
}

function serveSite(request: Request): Response | Promise<Response> {
  const file = siteFile(request.url);
  if (file === null) return notFound();
  return net.fetch(pathToFileURL(file).href).catch(notFound);
}

function askWhereToSave(item: DownloadItem): void {
  item.setSaveDialogOptions({
    title: "Save Preset",
    defaultPath: join(app.getPath("documents"), item.getFilename()),
    filters: [{ name: "Text files", extensions: ["txt"] }, { name: "All files", extensions: ["*"] }],
  });
}

function passClicks(event: IpcMainEvent, pass: unknown): void {
  BrowserWindow.fromWebContents(event.sender)?.setIgnoreMouseEvents(pass === true, { forward: true });
}

function createWindow(): BrowserWindow {
  const window = new BrowserWindow({
    title: TITLE,
    icon: WINDOW_ICON,
    width: CONTENT.width,
    height: CONTENT.height,
    useContentSize: true,
    center: true,
    show: false,
    frame: false,
    transparent: true,
    hasShadow: false,
    resizable: false,
    maximizable: false,
    fullscreenable: false,
    webPreferences: {
      preload: join(HERE, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });
  keepLinksOutside(window.webContents);
  window.webContents.once("did-finish-load", () => window.show());
  window.webContents.once("did-fail-load", () => window.show());
  void window.loadURL(`${OWN_PAGES}index.html`);
  return window;
}

function showAgain(): void {
  const window = BrowserWindow.getAllWindows()[0];
  if (window === undefined) return;
  if (window.isMinimized()) window.restore();
  window.focus();
}

function startApp(): void {
  Menu.setApplicationMenu(null);
  protocol.handle(SITE_SCHEME, serveSite);
  session.defaultSession.on("will-download", (_event, item) => askWhereToSave(item));
  ipcMain.on(QUIT_CHANNEL, () => app.quit());
  ipcMain.on(PASS_CLICKS_CHANNEL, passClicks);
  createWindow();
}

protocol.registerSchemesAsPrivileged([{ scheme: SITE_SCHEME, privileges: SITE_PRIVILEGES }]);

if (app.requestSingleInstanceLock()) {
  app.on("second-instance", showAgain);
  app.on("before-quit", () => session.defaultSession.flushStorageData());
  app.on("window-all-closed", () => app.quit());
  void app.whenReady().then(startApp);
} else {
  app.quit();
}
