import type {
  ProductCollectionId,
  ProductsCollectionsSummary,
} from "@/features/catalog";

export interface CategoriesNavItem {
  collection: Exclude<ProductCollectionId, "todos">;
  iconSrc: string;
  title: string;
  subtitle: string;
  href: string;
}

export const CATEGORIES_NAV_ITEMS: readonly CategoriesNavItem[] = [
  {
    collection: "kits",
    iconSrc: "/images/categorias/icons/kit.webp",
    title: "Kits",
    subtitle: "Kits exclusivos",
    href: "/kits",
  },
  {
    collection: "premium",
    iconSrc: "/images/categorias/icons/premium.webp",
    title: "Premium",
    subtitle: "Top sellers",
    href: "/premium",
  },
  {
    collection: "promocoes",
    iconSrc: "/images/categorias/icons/promocoes.webp",
    title: "Promoções",
    subtitle: "Ofertas disponíveis",
    href: "/promocoes",
  },
  {
    collection: "novidades",
    iconSrc: "/images/categorias/icons/novidades.webp",
    title: "Novidades",
    subtitle: "Recém chegados",
    href: "/novidades",
  },
];

/**
 * Decide se o chip da coleção entra na navegação.
 *
 * Promoções é coleção derivada: sem promoção vigente ela não tem o que listar, então o chip
 * some em vez de levar a uma vitrine vazia. Resumo ausente não esconde nada — falta de número
 * não é prova de que não há oferta.
 */
export function isCategoryNavItemVisible(
  item: CategoriesNavItem,
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
  item: CategoriesNavItem,
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
