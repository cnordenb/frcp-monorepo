export type PlatformKind = "web" | "desktop" | "mobile";

export interface Platform {
  readonly kind: PlatformKind;
  readonly linkBase: string;
  shareLink(url: string, title: string): Promise<boolean>;
  savePreset(name: string, text: string): Promise<boolean | null>;
  openUrl(url: string): void;
  quit(): void;
  onLink(handler: (code: string) => void): void;
  launchCode?(): Promise<string | null>;
}
