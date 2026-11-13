export const BRIDGE_NAME = "frcpDesktop";
export const QUIT_CHANNEL = "frcp:quit";
export const PASS_CLICKS_CHANNEL = "frcp:pass-clicks";

export interface DesktopBridge {
  quit(): void;
  passClicksThrough(pass: boolean): void;
}
