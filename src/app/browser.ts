import { clearHash, readHash } from "./actions/sharelinks.ts";
import type { Platform } from "./platform.ts";
import { h } from "./view/domhelpers.ts";

function clickLink(props: Record<string, string>): void {
  const a = h("a", props);
  document.body.append(a);
  a.click();
  a.remove();
}

export const browserPlatform: Platform = {
  kind: "web",
  get linkBase(): string {
    return location.href.split("#")[0];
  },
  async shareLink(): Promise<boolean> {
    return false;
  },
  async savePreset(name: string, text: string): Promise<boolean> {
    const url = URL.createObjectURL(new Blob([text], { type: "text/plain" }));
    clickLink({ href: url, download: name });
    setTimeout(() => URL.revokeObjectURL(url), 10000);
    return true;
  },
  openUrl(url: string): void {
    if (url.startsWith("aoe2de://")) clickLink({ href: url });
    else window.open(url, "_blank", "noopener");
  },
  quit(): void {
    location.assign("about:blank");
  },
  onLink(handler: (code: string) => void): void {
    window.addEventListener("hashchange", () => {
      const code = readHash();
      if (code === null) return;
      clearHash();
      handler(code);
    });
  },
};
