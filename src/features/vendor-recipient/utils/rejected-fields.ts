import type { VendorRecipientRejectedField } from "../types/vendor-recipient";

/**
 * Normaliza a lista de campos recusados, descartando entradas sem rótulo.
 *
 * O painel só sabe desenhar uma linha completa; entrada pela metade viraria ruído no lugar de
 * orientação.
 */
export function mapRejectedFields(value: unknown): VendorRecipientRejectedField[] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const entry = item as Record<string, unknown>;
    const label = typeof entry.label === "string" ? entry.label : "";
    const field = typeof entry.field === "string" ? entry.field : "";

    if (!label || !field) return [];

    return [
      {
        detail: typeof entry.detail === "string" ? entry.detail : "",
        field,
        group: typeof entry.group === "string" ? entry.group : "outros",
        hint: typeof entry.hint === "string" ? entry.hint : "",
        label,
      },
    ];
  });
}
