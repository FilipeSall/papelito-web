/**
 * Valor digitado da nota em centavos, ou `null` quando não há número.
 *
 * O separador decimal é decidido pelo último `,` ou `.` seguido de um ou dois
 * dígitos; qualquer outro separador é milhar. Assumir a vírgula fazia
 * `110.27` — o que boa parte dos teclados de celular entrega em `inputMode`
 * decimal — virar R$ 123.456,00.
 */
export function parseFiscalAmountToCents(raw: string): number | null {
  const value = raw.trim();

  if (value === "") return null;

  const separatorAt = Math.max(value.lastIndexOf(","), value.lastIndexOf("."));
  const decimals = separatorAt >= 0 ? value.length - separatorAt - 1 : 0;
  const hasDecimals = separatorAt >= 0 && decimals >= 1 && decimals <= 2;

  const whole = digitsOf(hasDecimals ? value.slice(0, separatorAt) : value);
  const fraction = hasDecimals ? digitsOf(value.slice(separatorAt + 1)).padEnd(2, "0").slice(0, 2) : "00";

  if (whole === "" && !hasDecimals) return null;

  const cents = Number(`${whole === "" ? "0" : whole}${fraction}`);

  return Number.isSafeInteger(cents) ? cents : null;
}

function digitsOf(value: string): string {
  return value.replace(/\D/g, "");
}
