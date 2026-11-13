import { ctx } from "../context.ts";
import { find } from "./domhelpers.ts";
import { hideTip } from "./tooltips.ts";

let openMenuEl: HTMLElement | null = null;

export function currentMenu(): HTMLElement | null {
  return openMenuEl;
}

export function openMenu(menu: HTMLElement): void {
  if (openMenuEl === menu) return;
  closeMenus();
  hideTip();
  menu.classList.add("open");
  find(menu, ".menu-list").hidden = false;
  find(menu, ".menu-title").setAttribute("aria-expanded", "true");
  openMenuEl = menu;
  fitMenu();
}

export function fitMenu(): void {
  if (!ctx.simple || !openMenuEl) return;
  const list = find(openMenuEl, ".menu-list");
  const room = ctx.els.client.getBoundingClientRect().bottom - list.getBoundingClientRect().top;
  list.style.setProperty("--room", room + "px");
}

export function closeMenus(): void {
  if (!openMenuEl) return;
  const title = find(openMenuEl, ".menu-title");
  if (ctx.simple && openMenuEl.contains(document.activeElement)) title.focus();
  openMenuEl.classList.remove("open");
  find(openMenuEl, ".menu-list").hidden = true;
  title.setAttribute("aria-expanded", "false");
  openMenuEl = null;
}

function menuItems(menu: HTMLElement): HTMLElement[] {
  const all = menu.querySelectorAll<HTMLElement>(".menu-list > :is(button, a)");
  return [...all].filter((el) => el.checkVisibility());
}

function openAt(menu: HTMLElement, last = false): void {
  openMenu(menu);
  const list = menuItems(menu);
  if (list.length) list[last ? list.length - 1 : 0].focus();
}

function bindTitleKeys(menu: HTMLElement): void {
  const title = find(menu, ".menu-title");
  title.setAttribute("aria-haspopup", "menu");
  title.addEventListener("keydown", (e) => {
    if (!["Enter", " ", "ArrowDown", "ArrowUp"].includes(e.key) || e.altKey || e.ctrlKey || e.metaKey) return;
    e.preventDefault();
    e.stopPropagation();
    openAt(menu, e.key === "ArrowUp");
  });
  title.addEventListener("keyup", (e) => {
    if (e.key === " ") e.preventDefault();
  });
}

function onListKey(menus: HTMLElement[], menu: HTMLElement, e: KeyboardEvent): void {
  if (e.altKey || e.ctrlKey || e.metaKey) return;
  const list = menuItems(menu);
  const i = list.indexOf(document.activeElement as HTMLElement);
  const moves: Record<string, number | undefined> = {
    ArrowDown: (i + 1) % list.length, ArrowUp: (i - 1 + list.length) % list.length, Home: 0, End: list.length - 1,
  };
  const move = moves[e.key];
  if (e.key === "Tab") {
    closeMenus();
    return;
  }
  if (move === undefined && !["Escape", "ArrowLeft", "ArrowRight"].includes(e.key)) return;
  e.preventDefault();
  e.stopPropagation();
  if (move !== undefined) list[move].focus();
  else if (e.key === "Escape") closeMenus();
  else openAt(menus[(menus.indexOf(menu) + (e.key === "ArrowRight" ? 1 : menus.length - 1)) % menus.length]);
}

export function bindMenuKeys(): void {
  const menus = [...document.querySelectorAll<HTMLElement>("#menubar .menu")];
  for (const menu of menus) {
    bindTitleKeys(menu);
    find(menu, ".menu-list").addEventListener("keydown", (e) => onListKey(menus, menu, e));
    menu.addEventListener("focusout", (e) => {
      if (openMenuEl === menu && !(e.relatedTarget instanceof Node && menu.contains(e.relatedTarget))) closeMenus();
    });
  }
}
