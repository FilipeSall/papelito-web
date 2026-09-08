import type { CollectionNavItem } from "@/types/home-assets";

export const COLLECTION_NAV_MAX_ITEMS = 8;
export const COLLECTION_NAV_TITLE_MAX_LENGTH = 24;
export const COLLECTION_NAV_SUBTITLE_MAX_LENGTH = 40;

/** Coleções derivadas com número próprio no catálogo — as únicas que o WordPress aceita gravar. */
export const COLLECTION_NAV_LIVE_SOURCES = [
  { collection: "kits", label: "Kits — quantidade disponível" },
  { collection: "promocoes", label: "Promoções — maior desconto" },
] as const;

export type CollectionsNavValidation = {
  isValid: boolean;
  message: string;
};

export function isInternalPath(href: string) {
  return /^\/(?!\/)/.test(href.trim());
}

export function getCollectionsNavValidation(
  items: CollectionNavItem[],
): CollectionsNavValidation {
  if (items.length > COLLECTION_NAV_MAX_ITEMS) {
    return {
      isValid: false,
      message: `O corredor aceita no máximo ${COLLECTION_NAV_MAX_ITEMS} cards.`,
    };
  }

  const invalidIndex = items.findIndex(
    (item) =>
      item.title.trim() === "" ||
      item.subtitle.trim() === "" ||
      item.title.trim().length > COLLECTION_NAV_TITLE_MAX_LENGTH ||
      item.subtitle.trim().length > COLLECTION_NAV_SUBTITLE_MAX_LENGTH ||
      !isInternalPath(item.href),
  );

  if (invalidIndex >= 0) {
    return {
      isValid: false,
      message: `Preencha título, texto auxiliar e um destino interno começando com barra no card ${invalidIndex + 1}.`,
    };
  }

  return { isValid: true, message: "" };
}
