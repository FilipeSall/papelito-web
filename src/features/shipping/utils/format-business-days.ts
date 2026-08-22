/**
 * Prazo de entrega com concordância correta: "1 dia útil", "5 dias úteis".
 */
export function formatBusinessDays(days: number): string {
  const rounded = Math.max(0, Math.round(days));

  return rounded === 1 ? "1 dia útil" : `${rounded} dias úteis`;
}
