import type { HomeFeatureItem } from "@/types/home-assets";

export const HOME_FEATURES_COUNT = 4;
export const HOME_FEATURE_TITLE_MAX_LENGTH = 32;
export const HOME_FEATURE_SUBTITLE_MAX_LENGTH = 44;

export type HomeFeaturesValidation = {
  isValid: boolean;
  message: string;
};

export function getHomeFeaturesValidation(items: HomeFeatureItem[]): HomeFeaturesValidation {
  if (items.length !== HOME_FEATURES_COUNT) {
    return {
      isValid: false,
      message: `A Home precisa manter exatamente ${HOME_FEATURES_COUNT} benefícios comerciais.`,
    };
  }

  const invalidIndex = items.findIndex(
    (item) =>
      item.title.trim() === "" ||
      item.subtitle.trim() === "" ||
      item.title.trim().length > HOME_FEATURE_TITLE_MAX_LENGTH ||
      item.subtitle.trim().length > HOME_FEATURE_SUBTITLE_MAX_LENGTH ||
      item.iconUrl.trim() === "",
  );

  if (invalidIndex >= 0) {
    return {
      isValid: false,
      message: `Preencha título, texto auxiliar e ícone válido no benefício ${invalidIndex + 1}.`,
    };
  }

  return { isValid: true, message: "" };
}
