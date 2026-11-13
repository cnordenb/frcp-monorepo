const NARROWER_THAN = /^\(max-width:/;
const WIDER_THAN = /^\(min-width:/;

function phoneQuery(query: string): string {
  const conditions = query.trim().split(/\s+and\s+/);
  if (conditions.some((condition) => WIDER_THAN.test(condition))) return "not all";
  const kept = conditions.filter((condition) => !NARROWER_THAN.test(condition));
  return kept.length ? kept.join(" and ") : "all";
}

export function phoneMediaFor(media: string): string {
  return media.split(",").map(phoneQuery).join(", ");
}
