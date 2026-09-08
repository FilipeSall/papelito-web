import type { ProductsCollectionsSummary } from "@/features/catalog";
import type { CollectionNavItem } from "@/types/home-assets";

/**
 * Decide se o chip da coleção entra na navegação.
 *
 * Promoções é coleção derivada: sem promoção vigente ela não tem o que listar, então o chip
 * some em vez de levar a uma vitrine vazia. Resumo ausente não esconde nada — falta de número
 * não é prova de que não há oferta.
 */
export function isCategoryNavItemVisible(
  item: CollectionNavItem,
  summary?: ProductsCollectionsSummary | null,
) {
  if (!summary) {
    return true;
  }

  if (item.collection === "promocoes") {
    return summary.promotionsCount > 0;
  }

  return true;
}

/**
 * Texto auxiliar do card: número real de kits e maior desconto real das promoções.
 *
 * O `subtitle` do item continua sendo o fallback — coleção sem número próprio mantém o texto
 * fixo genérico em vez de anunciar "0 kits disponíveis" ou "Até 0% off".
 */
export function resolveCategoryNavSubtitle(
  item: CollectionNavItem,
  summary?: ProductsCollectionsSummary | null,
) {
  if (!summary) {
    return item.subtitle;
  }

  if (item.collection === "kits" && summary.kitsCount > 0) {
    return summary.kitsCount === 1
      ? "1 kit disponível"
      : `${summary.kitsCount} kits disponíveis`;
  }

  if (
    item.collection === "promocoes" &&
    summary.promotionsMaxDiscountPercent > 0
  ) {
    return `Até ${summary.promotionsMaxDiscountPercent}% off`;
  }

  return item.subtitle;
}
