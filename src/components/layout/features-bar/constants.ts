import type { HomeFeatureItem } from "@/types/home-assets";

/** Fallback de compatibilidade durante a migração da configuração da Home. */
export const FEATURES_BAR_ITEMS: HomeFeatureItem[] = [
  {
    id: "frete-gratis",
    iconUrl: "/images/icons/truck.svg",
    title: "Frete Grátis",
    subtitle: "Acima de R$500",
    iconId: 0,
  },
  {
    id: "troca-facil",
    iconUrl: "/images/icons/refresh.svg",
    title: "Troca Fácil",
    subtitle: "15 dias para troca",
    iconId: 0,
  },
  {
    id: "parcelamos",
    iconUrl: "/images/icons/price.svg",
    title: "Parcelamos",
    subtitle: "Em 3x sem juros",
    iconId: 0,
  },
  {
    id: "envio-rapido",
    iconUrl: "/images/icons/thunder.svg",
    title: "Envio Rápido",
    subtitle: "Sai no mesmo dia",
    iconId: 0,
  },
];
