export function normalizeKey(value: string) {
  let normalized = value
    .normalize("NFD")
    .replaceAll(/\p{M}/gu, "")
    .toLowerCase()
    .replaceAll("&amp;", "e")
    .replaceAll(/[^a-z0-9]+/g, "-");

  while (normalized.startsWith("-")) {
    normalized = normalized.slice(1);
  }

  while (normalized.endsWith("-")) {
    normalized = normalized.slice(0, -1);
  }

  return normalized;
}
