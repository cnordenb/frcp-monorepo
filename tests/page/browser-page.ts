import { type Browser, type ChromeEvent, sleep } from "./chrome.ts";

export interface PageOptions {
  url?: string;
  width?: number;
  height?: number;
  mobile?: boolean;
  dark?: boolean;
  forcedColors?: boolean;
  storage?: Record<string, unknown>;
  ready?: string;
}

export interface KeyMods {
  ctrl?: boolean;
  shift?: boolean;
}

export interface Point {
  x: number;
  y: number;
}

export type TouchType = "touchStart" | "touchMove" | "touchEnd";

export interface Page {
  eval<T = unknown>(expression: string): Promise<T>;
  send<T = unknown>(method: string, params?: object): Promise<T>;
  errors: string[];
  waitFor(expression: string, what?: string, ms?: number): Promise<void>;
  key(key: string, mods?: KeyMods): Promise<void>;
  click(x: number, y: number): Promise<void>;
  move(x: number, y: number): Promise<void>;
  touch(type: TouchType, points: Point[]): Promise<void>;
  close(): Promise<void>;
}

interface Thrown {
  text: string;
  exception?: { description?: string };
}

interface Evaluated {
  result: { value?: unknown };
  exceptionDetails?: Thrown;
}

interface ConsoleCall {
  type: string;
  args: { value?: unknown; description?: string }[];
}

type Send = <T = unknown>(method: string, params?: object) => Promise<T>;
type Evaluate = <T = unknown>(expression: string) => Promise<T>;

const KEYS: Record<string, [code: number, name: string, text?: string]> = {
  Tab: [9, "Tab"],
  Enter: [13, "Enter", "\r"],
  Escape: [27, "Escape"],
  " ": [32, "Space", " "],
  ArrowLeft: [37, "ArrowLeft"],
  ArrowUp: [38, "ArrowUp"],
  ArrowRight: [39, "ArrowRight"],
  ArrowDown: [40, "ArrowDown"],
  Home: [36, "Home"],
  End: [35, "End"],
  F2: [113, "F2"],
  F8: [119, "F8"],
  F9: [120, "F9"],
};

const READY = "document.getElementById('enabledCount')?.textContent";

function thrownText(thrown: Thrown): string {
  return thrown.exception?.description ?? thrown.text;
}

function watchErrors(sessionId: string, errors: string[]): (event: ChromeEvent) => void {
  return (event) => {
    if (event.sessionId !== sessionId) return;
    if (event.method === "Runtime.exceptionThrown") {
      errors.push(thrownText((event.params as { exceptionDetails: Thrown }).exceptionDetails));
    }
    if (event.method !== "Runtime.consoleAPICalled") return;
    const call = event.params as ConsoleCall;
    if (call.type === "error") errors.push(call.args.map((a) => a.value ?? a.description).join(" "));
  };
}

async function emulate(send: Send, opts: PageOptions): Promise<void> {
  const { width = 1280, height = 900, mobile = false } = opts;
  await send("Emulation.setFocusEmulationEnabled", { enabled: true });
  for (const domain of ["Page", "Runtime", "Network"]) await send(domain + ".enable");
  await send("Network.setCacheDisabled", { cacheDisabled: true });
  await send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile });
  if (mobile) await send("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 5 });
  const features = [
    { name: "prefers-color-scheme", value: opts.dark ? "dark" : "light" },
    { name: "forced-colors", value: opts.forcedColors ? "active" : "none" },
  ];
  await send("Emulation.setEmulatedMedia", { features });
}

function evaluator(send: Send): Evaluate {
  return async <T>(expression: string): Promise<T> => {
    const done = await send<Evaluated>("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
    if (done.exceptionDetails) throw new Error(thrownText(done.exceptionDetails));
    return done.result.value as T;
  };
}

async function load(send: Send, evaluate: Evaluate, base: string, opts: PageOptions): Promise<void> {
  const go = async (to: string): Promise<void> => {
    await send("Page.navigate", { url: to });
    for (let i = 0; i < 200 && (await evaluate("document.readyState")) !== "complete"; i++) await sleep(25);
  };
  const stored = Object.entries(opts.storage ?? {}).map(
    ([key, value]) => `localStorage.setItem(${JSON.stringify(key)}, ${JSON.stringify(JSON.stringify(value))});`,
  );
  await go(base + "/favicon.ico");
  await evaluate(`localStorage.clear(); ${stored.join("")}`);
  await go(base + (opts.url ?? "/"));
  await evaluate(`new Promise((ok) => { const t = () => (${opts.ready ?? READY}) ? ok() : setTimeout(t, 20); t(); })`);
  await evaluate("document.fonts.ready");
}

function keyPresser(send: Send): Page["key"] {
  return async (key, mods = {}) => {
    const known = KEYS[key];
    const code = known ? known[0] : key.toUpperCase().charCodeAt(0);
    const name = known ? known[1] : /\d/.test(key) ? "Digit" + key : "Key" + key.toUpperCase();
    const text = mods.ctrl ? undefined : known ? known[2] : key;
    const modifiers = (mods.ctrl ? 2 : 0) | (mods.shift ? 8 : 0);
    const base = { modifiers, windowsVirtualKeyCode: code, code: name, key };
    const type = text ? "keyDown" : "rawKeyDown";
    await send("Input.dispatchKeyEvent", { type, ...base, text, unmodifiedText: text });
    await send("Input.dispatchKeyEvent", { type: "keyUp", ...base });
    await sleep(30);
  };
}

function pointer(send: Send): Pick<Page, "click" | "move" | "touch"> {
  return {
    async click(x, y) {
      for (const type of ["mouseMoved", "mousePressed", "mouseReleased"]) {
        await send("Input.dispatchMouseEvent", { type, x, y, button: "left", clickCount: 1 });
      }
      await sleep(30);
    },
    async move(x, y) {
      await send("Input.dispatchMouseEvent", { type: "mouseMoved", x, y });
      await sleep(30);
    },
    async touch(type, touchPoints) {
      await send("Input.dispatchTouchEvent", { type, touchPoints });
    },
  };
}

function waiter(evaluate: Evaluate): Page["waitFor"] {
  return async (expression, what = expression, ms = 3000) => {
    for (const end = Date.now() + ms; Date.now() < end; await sleep(25)) if (await evaluate(expression)) return;
    throw new Error(`timed out waiting for ${what}`);
  };
}

export async function openPage(browser: Browser, base: string, opts: PageOptions = {}): Promise<Page> {
  const { targetId } = await browser.send<{ targetId: string }>("Target.createTarget", {
    url: "about:blank",
    newWindow: true,
  });
  const attached = await browser.send<{ sessionId: string }>("Target.attachToTarget", { targetId, flatten: true });
  const send: Send = (method, params) => browser.send(method, params, attached.sessionId);
  const errors: string[] = [];
  const onEvent = watchErrors(attached.sessionId, errors);
  browser.listeners.add(onEvent);
  const evaluate = evaluator(send);
  await emulate(send, opts);
  await load(send, evaluate, base, opts);
  return {
    eval: evaluate,
    send,
    errors,
    waitFor: waiter(evaluate),
    key: keyPresser(send),
    ...pointer(send),
    async close() {
      browser.listeners.delete(onEvent);
      await browser.send("Target.closeTarget", { targetId });
    },
  };
}
