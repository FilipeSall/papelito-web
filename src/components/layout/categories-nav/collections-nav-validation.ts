import type { CollectionNavItem } from "@/types/home-assets";

export const COLLECTION_NAV_MAX_ITEMS = 6;
export const COLLECTION_NAV_TITLE_MAX_LENGTH = 24;
export const COLLECTION_NAV_SUBTITLE_MAX_LENGTH = 40;

export type CollectionsNavValidation = {
  isValid: boolean;
  message: string;
};

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
      !item.collectionId ||
      item.title.trim().length > COLLECTION_NAV_TITLE_MAX_LENGTH ||
      item.subtitle.trim().length > COLLECTION_NAV_SUBTITLE_MAX_LENGTH,
  );

  if (invalidIndex >= 0) {
    return {
      isValid: false,
      message: `Selecione uma coleção e preencha textos válidos no card ${invalidIndex + 1}. O destino é calculado pela coleção.`,
    };
  }

  return { isValid: true, message: "" };
}
