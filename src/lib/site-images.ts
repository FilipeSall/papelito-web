import type { ManagedImageAsset, SiteImageAssetKey, SiteImageAssets } from "@/types/home-assets";

export const SITE_IMAGE_DEFAULTS: SiteImageAssets = {
  productHero: {
    imageId: 0,
    imageUrl: "/images/Rectangle21.png",
    alt: "Produtos Papelito - Made in Brazil.",
  },
  aboutHero: {
    imageId: 0,
    imageUrl: "/images/sobre-page/sobre-banner.png",
    alt: "Mulher sorrindo e segurando papéis Papelito diante de um fundo amarelo.",
  },
  aboutStory: {
    imageId: 0,
    imageUrl: "/images/sobre-page/fabrica-papelito.jpg",
    alt: "Sócios da Papelito em pé diante da linha de produção da fábrica.",
  },
  revendedorBusinessMain: {
    imageId: 0,
    imageUrl: "/images/revendedor/business-main.jpg",
    alt: "Parceira Papelito sorrindo em um ponto de venda.",
  },
  revendedorBusinessSecondary: {
    imageId: 0,
    imageUrl: "/images/revendedor/business-secondary.jpg",
    alt: "Equipe parceira Papelito em loja.",
  },
};

export const SITE_IMAGE_KEYS = Object.keys(SITE_IMAGE_DEFAULTS) as SiteImageAssetKey[];

export function isDefaultSiteImage(
  key: SiteImageAssetKey,
  image: ManagedImageAsset | undefined,
): boolean {
  return image?.imageId === 0 && image.imageUrl === SITE_IMAGE_DEFAULTS[key].imageUrl;
}
