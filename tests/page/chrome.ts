import { type ChildProcess, spawn } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, statSync } from "node:fs";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import os from "node:os";
import path from "node:path";
import type { Readable, Writable } from "node:stream";

export const SITE = process.env.FRCP_SITE ?? path.resolve(import.meta.dirname, "..", "..", "dist", "web");

export interface ChromeEvent {
  method: string;
  sessionId?: string;
  params: unknown;
}

interface Reply {
  id?: number;
  method?: string;
  sessionId?: string;
  params?: unknown;
  result?: unknown;
  error?: { message: string };
}

interface Waiting {
  ok: (result: unknown) => void;
  fail: (error: Error) => void;
  method: string;
}

export interface Browser {
  send<T = unknown>(method: string, params?: object, sessionId?: string): Promise<T>;
  listeners: Set<(event: ChromeEvent) => void>;
  close(): Promise<void>;
}

export interface Site {
  base: string;
  close(): void;
}

const TYPES: Record<string, string> = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "text/javascript",
  ".json": "application/json",
  ".webp": "image/webp",
  ".webm": "audio/webm",
  ".ico": "image/x-icon",
  ".txt": "text/plain",
};

const LINUX_NAMES = ["google-chrome", "google-chrome-stable", "chromium", "chromium-browser", "microsoft-edge"];
const LINUX_FOLDERS = ["/usr/bin/", "/usr/local/bin/", "/snap/bin/"];

export function findChrome(): string | null {
  const env = process.env;
  const windowsFolders = [env.PROGRAMFILES, env["PROGRAMFILES(X86)"], env.LOCALAPPDATA];
  const candidates = [
    env.CHROME_PATH,
    ...windowsFolders.flatMap((dir = "") => [
      path.join(dir, "Google", "Chrome", "Application", "chrome.exe"),
      path.join(dir, "Microsoft", "Edge", "Application", "msedge.exe"),
    ]),
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    ...LINUX_NAMES.flatMap((name) => LINUX_FOLDERS.map((dir) => dir + name)),
  ];
  return candidates.find((file) => file && existsSync(file)) ?? null;
}

export const CHROME = process.env.FRCP_NO_BROWSER ? null : findChrome();
const NOT_FOUND = "no Chrome, Edge or Chromium found (CHROME_PATH can point to one)";
export const skip: string | false = process.env.FRCP_NO_BROWSER ? "FRCP_NO_BROWSER is set" : CHROME ? false : NOT_FOUND;

export const sleep = (ms: number): Promise<void> => new Promise((ok) => setTimeout(ok, ms));

export function serveSite(root: string = SITE): Promise<Site> {
  const server = createServer((request, response) => {
    let name = decodeURIComponent(new URL(request.url ?? "/", "http://localhost").pathname);
    if (name.endsWith("/")) name += "index.html";
    const file = path.join(root, path.normalize(name));
    if (!file.startsWith(root) || !statSync(file, { throwIfNoEntry: false })?.isFile()) {
      response.writeHead(404);
      response.end();
      return;
    }
    const type = TYPES[path.extname(file)] ?? "application/octet-stream";
    response.writeHead(200, { "content-type": type, "cache-control": "no-store" });
    response.end(readFileSync(file));
  });
  return new Promise((ok) => {
    server.listen(0, "127.0.0.1", () => {
      const { port } = server.address() as AddressInfo;
      ok({ base: `http://127.0.0.1:${port}`, close: () => server.close() });
    });
  });
}

function startChrome(executable: string): ChildProcess {
  const profile = path.join(os.tmpdir(), "frcp-page-test-" + path.basename(process.argv[1] ?? "run", ".ts"));
  mkdirSync(profile, { recursive: true });
  const args = [
    "--headless",
    "--remote-debugging-pipe",
    `--user-data-dir=${profile}`,
    "--no-first-run",
    "--no-default-browser-check",
    "--disable-extensions",
    "--mute-audio",
    ...(process.platform === "linux" && process.env.CI ? ["--no-sandbox"] : []),
    "about:blank",
  ];
  return spawn(executable, args, { stdio: ["ignore", "ignore", "ignore", "pipe", "pipe"] });
}

function readReplies(from: Readable, onReply: (reply: Reply) => void): void {
  let buffer = "";
  from.on("data", (chunk: Buffer) => {
    buffer += chunk.toString("utf8");
    for (let end = buffer.indexOf("\0"); end >= 0; end = buffer.indexOf("\0")) {
      onReply(JSON.parse(buffer.slice(0, end)) as Reply);
      buffer = buffer.slice(end + 1);
    }
  });
}

function settle(waiting: Map<number, Waiting>, reply: Reply): void {
  const asked = waiting.get(reply.id ?? 0);
  if (!asked) return;
  waiting.delete(reply.id ?? 0);
  if (reply.error) asked.fail(new Error(`${asked.method}: ${reply.error.message}`));
  else asked.ok(reply.result);
}

export async function launch(executable: string): Promise<Browser> {
  const child = startChrome(executable);
  const toChrome = child.stdio[3] as Writable;
  const waiting = new Map<number, Waiting>();
  const listeners = new Set<(event: ChromeEvent) => void>();
  let lastId = 0;
  let quit: string | null = null;
  readReplies(child.stdio[4] as Readable, (reply) => {
    if (reply.id && waiting.has(reply.id)) settle(waiting, reply);
    else if (reply.method) for (const listen of listeners) listen(reply as ChromeEvent);
  });
  child.once("exit", (code, signal) => {
    quit = `Chrome quit (${signal ?? "exit code " + code})`;
    for (const { fail, method } of waiting.values()) fail(new Error(`${method}: ${quit}`));
    waiting.clear();
  });
  const send = <T>(method: string, params: object = {}, sessionId?: string): Promise<T> =>
    new Promise<T>((ok, fail) => {
      if (quit) return fail(new Error(`${method}: ${quit}`));
      const id = ++lastId;
      waiting.set(id, { ok: ok as (result: unknown) => void, fail, method });
      toChrome.write(JSON.stringify({ id, method, params, sessionId }) + "\0");
    });
  await send("Browser.getVersion");
  const close = async (): Promise<void> => {
    await send("Browser.close").catch(() => {});
    await new Promise<void>((ok) => (child.exitCode !== null ? ok() : child.once("exit", () => ok())));
  };
  return { send, listeners, close };
}
