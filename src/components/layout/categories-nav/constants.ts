import type { CollectionNavItem } from "@/types/home-assets";

/**
 * Cards ativos já chegam filtrados pelo backend; mesmo sem ofertas a coleção Promoções continua
 * visível para comunicar o estado vazio calculado pelo backend ("Confira as ofertas").
 */
export function isCategoryNavItemVisible(
  item: CollectionNavItem,
) {
  return Boolean(item.isActive);
}

/**
 * Texto auxiliar do card: número real de kits e maior desconto real das promoções.
 *
 * O `subtitle` do item continua sendo o fallback — coleção sem número próprio mantém o texto
 * fixo genérico em vez de anunciar "0 kits disponíveis" ou "Até 0% off".
 */
export function resolveCategoryNavSubtitle(
  item: CollectionNavItem,
) {
  return item.highlight?.text || item.subtitle;
}
