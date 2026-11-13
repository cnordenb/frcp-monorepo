import { lobbyUrl } from "../actions/linksout.ts";
import { applyLink, offerLink } from "../actions/sharelinks.ts";
import { ctx } from "../context.ts";
import { closeDialog, showFieldError, takePendingLink } from "../dialogs/dialogbox.ts";
import { bindOptions } from "../dialogs/optionsdialog.ts";
import { sfx } from "../sound/soundplayer.ts";
import { $ } from "../view/domhelpers.ts";
import { toast } from "../view/tooltips.ts";

function onLobbySubmit(e: SubmitEvent): void {
  e.preventDefault();
  const submitter = e.submitter as HTMLButtonElement | null;
  const spectate = submitter ? submitter.value === "spectate" : false;
  const url = lobbyUrl($<HTMLInputElement>("lobbyCode").value, spectate);
  if (!url) {
    sfx("error");
    showFieldError($("lobbyCode"), $("lobbyErr"));
    return;
  }
  closeDialog($("dlgLobby"));
  ctx.platform.openUrl(url);
}

function onOpenSubmit(e: SubmitEvent): void {
  e.preventDefault();
  const link = ctx.logic.parseShare($<HTMLInputElement>("openInput").value);
  if (!link) {
    sfx("error");
    showFieldError($("openInput"), $("openErr"));
    return;
  }
  closeDialog($("dlgOpen"));
  offerLink(link);
}

function onPreviewSubmit(e: SubmitEvent): void {
  e.preventDefault();
  $<HTMLDialogElement>("dlgPreview").close();
  const link = takePendingLink();
  if (!link) return;
  applyLink(link);
  sfx("button");
  toast("Loaded the shared link");
}

export function bindDialogs(): void {
  for (const d of document.querySelectorAll("dialog")) d.addEventListener("cancel", () => sfx("button"));
  for (const f of document.querySelectorAll<HTMLFormElement>("form[data-closes]")) {
    f.addEventListener("submit", (e) => {
      e.preventDefault();
      const dialog = f.closest("dialog");
      if (dialog) closeDialog(dialog);
    });
  }
  bindOptions();
  $("lobbyForm").addEventListener("submit", onLobbySubmit);
  $("openForm").addEventListener("submit", onOpenSubmit);
  $("previewForm").addEventListener("submit", onPreviewSubmit);
}
