import { contextBridge, ipcRenderer } from "electron";
import { BRIDGE_NAME, PASS_CLICKS_CHANNEL, QUIT_CHANNEL } from "./desktop-bridge.ts";
import type { DesktopBridge } from "./desktop-bridge.ts";

const bridge: DesktopBridge = {
  quit: () => ipcRenderer.send(QUIT_CHANNEL),
  passClicksThrough: (pass) => ipcRenderer.send(PASS_CLICKS_CHANNEL, pass === true),
};

contextBridge.exposeInMainWorld(BRIDGE_NAME, bridge);
