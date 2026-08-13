/**
 * Percentual de desconto do catálogo, em inteiro.
 *
 * Regra única: quem calcula desconto a partir de preço cheio e preço praticado usa
 * isto. Reimplementar a fórmula em cada consumidor fazia listagem, detalhe e vitrine
 * divergirem no arredondamento.
 */
export function calculateDiscountPercent(originalPrice: number, price: number) {
  if (
    !Number.isFinite(originalPrice) ||
    !Number.isFinite(price) ||
    originalPrice <= 0 ||
    price >= originalPrice
  ) {
    return 0;
  }

  return Math.round(((originalPrice - price) / originalPrice) * 100);
}
