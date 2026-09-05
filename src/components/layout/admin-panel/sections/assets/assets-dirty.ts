function withSortedKeys(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(withSortedKeys);
  }

  if (value !== null && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>).sort(([a], [b]) =>
      a.localeCompare(b),
    );

    return entries.map(([key, entry]) => [key, withSortedKeys(entry)]);
  }

  return value;
}

/**
 * Comparação por conteúdo, insensível à ordem das chaves: o objeto que volta do WordPress e o que
 * o formulário monta descrevem o mesmo asset, mas não necessariamente na mesma ordem de campos.
 */
export function isSameAsset(a: unknown, b: unknown): boolean {
  return JSON.stringify(withSortedKeys(a)) === JSON.stringify(withSortedKeys(b));
}
