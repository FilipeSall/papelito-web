/**
 * Conversão entre o campo monetário em pt-BR e centavos.
 *
 * Vive aqui porque os painéis de frete grátis e de parcelamento pediam a mesma conversão e a
 * mantinham duplicada, cada um com sua cópia da expressão regular.
 */

const BRL_PATTERN = /^(?:\d{1,3}(?:\.\d{3})*|\d+)(?:,\d{1,2})?$/;

export function parseBRLCents(value: FormDataEntryValue | null): number | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();

  if (!BRL_PATTERN.test(normalized)) {
    return null;
  }

  const [whole, decimal = ""] = normalized.split(",");
  const cents = Number(whole.replaceAll(".", "")) * 100 + Number(decimal.padEnd(2, "0"));

  return Number.isSafeInteger(cents) && cents > 0 ? cents : null;
}

export function formatCentsForInput(cents: number | null): string {
  if (!cents || cents <= 0) {
    return "";
  }

  return (cents / 100).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
