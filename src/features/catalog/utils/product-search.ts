export function normalizeProductSearch(value: string | undefined) {
  return (value ?? "").trim().replace(/\s+/g, " ").slice(0, 100);
}
