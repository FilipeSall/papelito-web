export const MAX_INSTALLMENTS = 12;

export function createInstallmentOptions(maxInstallments: number): string[] {
  const count = Number.isSafeInteger(maxInstallments)
    ? Math.max(0, Math.min(MAX_INSTALLMENTS, maxInstallments))
    : 0;

  return Array.from({ length: count }, (_, index) => `${index + 1}x sem juros`);
}
