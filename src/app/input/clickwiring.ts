import { runAction } from "../actions/actionmap.ts";
import { copyText } from "../actions/sharelinks.ts";
import { ctx } from "../context.ts";
import { closeDialog } from "../dialogs/dialogbox.ts";
import { sfx } from "../sound/soundplayer.ts";
import { $, find } from "../view/domhelpers.ts";
import { closeMenus, currentMenu, openMenu } from "../view/pagemenus.ts";

let swallowClick = false;

function sayInShareDialog(text: string): void {
  if (!ctx.simple) return;
  $("shareStatus").textContent = "";
  setTimeout(() => {
    $("shareStatus").textContent = text;
  }, 50);
}

function copyField(copy: HTMLElement): void {
  const input = $<HTMLInputElement>(copy.dataset.copy ?? "");
  void copyText(input.value).then((ok) => {
    if (ok) {
      sfx("button");
      sayInShareDialog("Copied the link.");
    } else {
      input.focus();
      input.select();
      sayInShareDialog("Couldn't copy the link. It's selected, so press Ctrl+C to copy it.");
    }
  });
}

function onDocumentClick(e: MouseEvent): void {
  if (!(e.target instanceof Element)) return;
  const closer = e.target.closest("[data-close]");
  if (closer) {
    const dialog = closer.closest("dialog");
    if (dialog) closeDialog(dialog);
    return;
  }
  const act = e.target.closest<HTMLElement>("[data-act]");
  if (act) {
    closeMenus();
    runAction(act.dataset.act ?? "");
    return;
  }
  const copy = e.target.closest<HTMLElement>("[data-copy]");
  if (copy) {
    copyField(copy);
    return;
  }
  if (e.target.closest(".menu-list a")) {
    sfx("button");
    closeMenus();
  }
}

function onMenuPointerDown(e: PointerEvent): void {
  swallowClick = false;
  const menu = currentMenu();
  const target = e.target;
  const inMenu = menu !== null && target instanceof Node && menu.contains(target);
  const onTitle = target instanceof Element && target.closest(".menu-title") !== null;
  if (menu && !inMenu && !onTitle) {
    closeMenus();
    swallowClick = ctx.simple;
  }
}

function onSwallowedClick(e: MouseEvent): void {
  if (!swallowClick) return;
  swallowClick = false;
  if (e.detail === 0) return;
  e.preventDefault();
  e.stopPropagation();
}

function releaseSwallowedClick(): void {
  if (!swallowClick) return;
  setTimeout(() => {
    swallowClick = false;
  });
}

export function bindMenus(): void {
  for (const menu of document.querySelectorAll<HTMLElement>(".menu")) {
    const title = find(menu, ".menu-title");
    title.addEventListener("click", () => (currentMenu() === menu ? closeMenus() : openMenu(menu)));
    title.addEventListener("mouseenter", () => {
      const open = currentMenu();
      if (open && open !== menu) openMenu(menu);
    });
  }
  document.addEventListener("pointerdown", onMenuPointerDown);
  document.addEventListener("click", onSwallowedClick, true);
  for (const type of ["pointerup", "pointercancel"]) document.addEventListener(type, releaseSwallowedClick);
}

export function bindClicks(): void {
  document.addEventListener("click", onDocumentClick);
}
