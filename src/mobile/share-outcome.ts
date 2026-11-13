export function isShareDismissal(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /cancel|abort/i.test(message);
}
