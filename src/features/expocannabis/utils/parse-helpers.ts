/** Diz se o valor é um objeto simples. */
export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Inteiro do JSON, ou `null` quando o campo não é número inteiro. */
export function int(value: unknown): number | null {
  return typeof value === "number" && Number.isInteger(value) ? value : null;
}

/** Texto do JSON, ou `null` quando o campo não é string. */
export function str(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

/** Lista de inteiros, ou `null` quando algum item não é inteiro. */
export function ints(value: unknown): number[] | null {
  if (!Array.isArray(value)) return null;
  const parsed = value.map(int);
  return parsed.every((item): item is number => item !== null) ? parsed : null;
}

/** Aplica o parser a cada item e falha inteiro se um item falhar. */
export function every<T>(value: unknown, parse: (item: unknown) => T | null): T[] | null {
  if (!Array.isArray(value)) return null;
  const parsed = value.map(parse);
  return parsed.every((item): item is T => item !== null) ? parsed : null;
}

/** Diz se algum valor obrigatório ficou ausente. */
export function hasNull(values: readonly unknown[]): boolean {
  return values.some((value) => value === null);
}
