export interface Pressable {
  click(): void;
}

export interface BackPage {
  querySelector(selector: string): Pressable | null;
}

export const OPEN_DIALOG_CLOSER = "dialog[open] [data-close]";
export const OPEN_MENU_TITLE = ".menu.open .menu-title";

export function pressBack(page: BackPage, leave: () => void): void {
  for (const selector of [OPEN_DIALOG_CLOSER, OPEN_MENU_TITLE]) {
    const target = page.querySelector(selector);
    if (target) {
      target.click();
      return;
    }
  }
  leave();
}
