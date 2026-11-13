export type LinkSource = "launch" | "open";

type Deliver = (code: string) => void;

export interface LinkRoute {
  receive(url: string, source: LinkSource): void;
  takeHeld(): string | null;
  listen(handler: Deliver): void;
}

export function linkCode(url: string | null | undefined): string | null {
  if (!url) return null;
  const hash = url.indexOf("#");
  if (hash < 0) return null;
  const fragment = url.slice(hash + 1);
  return fragment.startsWith("p=") ? fragment.slice(2) : null;
}

function createLinkInbox(deliver: Deliver): (url: string, source: LinkSource) => void {
  let launchUrl: string | null = null;
  let firstOpenUrl: string | null = null;
  let opens = 0;
  return (url, source) => {
    const twin = source === "launch" ? firstOpenUrl : opens === 0 ? launchUrl : null;
    if (source === "launch") launchUrl = url;
    else if (opens++ === 0) firstOpenUrl = url;
    if (twin === url) return;
    const code = linkCode(url);
    if (code !== null) deliver(code);
  };
}

export function createLinkRoute(): LinkRoute {
  let held: string | null = null;
  let handler: Deliver | null = null;
  const receive = createLinkInbox((code) => {
    if (handler) handler(code);
    else held = code;
  });
  const takeHeld = (): string | null => {
    const code = held;
    held = null;
    return code;
  };
  const listen = (next: Deliver): void => {
    handler = next;
  };
  return { receive, takeHeld, listen };
}
