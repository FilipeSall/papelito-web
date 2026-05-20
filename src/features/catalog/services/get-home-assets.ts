import "server-only";

import { wpRest } from "@/lib/server/wp-rest";
import type {
  HeroBanner,
  ManagedImageAsset,
  PartnerBannerConfig,
  PromoBannerConfig,
  SiteImageAssetKey,
  SiteImageAssets,
} from "@/types/home-assets";

type WpHeroResponse = {
  banners?: Partial<HeroBanner>[];
};

type WpPromoResponse = {
  banner?: Partial<PromoBannerConfig>;
};

type WpPartnerResponse = {
  banner?: Partial<PartnerBannerConfig>;
};

type WpSiteImagesResponse = {
  images?: Partial<Record<SiteImageAssetKey, Partial<ManagedImageAsset>>>;
};

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function toNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function toBoolean(value: unknown) {
  return typeof value === "boolean" ? value : false;
}

const SITE_IMAGE_DEFAULTS: SiteImageAssets = {
  productHero: {
    imageId: 0,
    imageUrl: "/images/Rectangle21.png",
    alt: "Produtos Papelito - Made in Brazil.",
  },
  aboutHero: {
    imageId: 0,
    imageUrl: "/images/sobre-page/sobre-banner.png",
    alt: "Mulher sorrindo e segurando papeis Papelito diante de um fundo amarelo.",
  },
  aboutStory: {
    imageId: 0,
    imageUrl: "/images/sobre-page/fabrica-papelito.jpg",
    alt: "Socios da Papelito em pe diante da linha de producao da fabrica.",
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
  revendedorBusinessIllustration: {
    imageId: 0,
    imageUrl: "/images/revendedor/business-card-vector.svg",
    alt: "Ilustracao de atendimento a negocios revendedores.",
  },
};

const SITE_IMAGE_KEYS = Object.keys(SITE_IMAGE_DEFAULTS) as SiteImageAssetKey[];

function mapHeroBanner(banner: Partial<HeroBanner> | undefined, index: number): HeroBanner | null {
  if (!banner) {
    return null;
  }

  const id = cleanText(banner.id) || `hero-${index + 1}`;
  const desktopImageUrl = cleanText(banner.desktopImageUrl);
  const mobileImageUrl = cleanText(banner.mobileImageUrl);

  if (!desktopImageUrl || !mobileImageUrl) {
    return null;
  }

  return {
    id,
    desktopImageId: toNumber(banner.desktopImageId),
    desktopImageUrl,
    mobileImageId: toNumber(banner.mobileImageId),
    mobileImageUrl,
    alt: cleanText(banner.alt),
    href: cleanText(banner.href),
    order: toNumber(banner.order) || index + 1,
    isActive: toBoolean(banner.isActive),
  };
}

function mapPromoBanner(banner: Partial<PromoBannerConfig> | undefined): PromoBannerConfig | null {
  if (!banner) {
    return null;
  }

  const ctaLabel = cleanText(banner.ctaLabel);
  const href = cleanText(banner.href);

  if (!ctaLabel || !href) {
    return null;
  }

  return {
    ctaLabel,
    href,
    isActive: toBoolean(banner.isActive),
  };
}

function mapPartnerBanner(
  banner: Partial<PartnerBannerConfig> | undefined,
): PartnerBannerConfig | null {
  if (!banner) {
    return null;
  }

  const desktopImageUrl = cleanText(banner.desktopImageUrl) || "/images/CT1A3510%201.png";
  const mobileImageUrl = cleanText(banner.mobileImageUrl) || "/images/pdv-mobile.jpg";
  const tag = cleanText(banner.tag) || "Seja um parceiro";
  const description =
    cleanText(banner.description) ||
    "Junte-se ao nosso PDV Perfeito com lojistas em todo o Brasil. Receba brindes, premios e beneficios exclusivos";
  const ctaLabel = cleanText(banner.ctaLabel) || "Quero ser um parceiro";
  const href = cleanText(banner.href) || "/revendedor";
  const alt = cleanText(banner.alt) || "Parceiros no espaco PDV Perfeito Papelito.";

  if (!desktopImageUrl || !mobileImageUrl || !tag || !description || !ctaLabel || !href || !alt) {
    return null;
  }

  return {
    tag,
    description,
    ctaLabel,
    href,
    desktopImageId: toNumber(banner.desktopImageId),
    desktopImageUrl,
    mobileImageId: toNumber(banner.mobileImageId),
    mobileImageUrl,
    alt,
    isActive: toBoolean(banner.isActive),
  };
}

function mapImageAsset(
  key: SiteImageAssetKey,
  image: Partial<ManagedImageAsset> | null | undefined,
): ManagedImageAsset {
  const fallback = SITE_IMAGE_DEFAULTS[key];

  return {
    imageId: toNumber(image?.imageId),
    imageUrl: cleanText(image?.imageUrl) || fallback.imageUrl,
    alt: cleanText(image?.alt) || fallback.alt,
  };
}

function mapSiteImages(images: WpSiteImagesResponse["images"] | null | undefined): SiteImageAssets {
  return SITE_IMAGE_KEYS.reduce((mapped, key) => {
    mapped[key] = mapImageAsset(key, images?.[key]);
    return mapped;
  }, {} as SiteImageAssets);
}

export async function getHomeHeroBanners(): Promise<HeroBanner[]> {
  const result = await wpRest<WpHeroResponse>(
    "/papelito/v1/home/hero-banners",
    process.env.NODE_ENV === "development"
      ? {}
      : {
          revalidate: 60,
          tags: ["wp:home-hero-banners"],
        },
  );

  if (!result.ok) {
    if (result.status !== 404) {
      console.warn("[home-hero-banners] Falha ao consultar hero banners.", result.error.message);
    }
    return [];
  }

  return Array.isArray(result.data.banners)
    ? result.data.banners
        .map((banner, index) => mapHeroBanner(banner, index))
        .filter((banner): banner is HeroBanner => banner !== null)
        .sort((left, right) => left.order - right.order)
    : [];
}

export async function getHomePromoBanner(): Promise<PromoBannerConfig | null> {
  const result = await wpRest<WpPromoResponse>(
    "/papelito/v1/home/promo-banner",
    process.env.NODE_ENV === "development"
      ? {}
      : {
          revalidate: 60,
          tags: ["wp:home-promo-banner"],
        },
  );

  if (!result.ok) {
    if (result.status !== 404) {
      console.warn("[home-promo-banner] Falha ao consultar promo banner.", result.error.message);
    }
    return null;
  }

  return mapPromoBanner(result.data.banner);
}

export async function getHomePartnerBanner(): Promise<PartnerBannerConfig | null> {
  const result = await wpRest<WpPartnerResponse>(
    "/papelito/v1/home/partner-banner",
    process.env.NODE_ENV === "development"
      ? {}
      : {
          revalidate: 60,
          tags: ["wp:home-partner-banner"],
        },
  );

  if (!result.ok) {
    if (result.status !== 404) {
      console.warn("[home-partner-banner] Falha ao consultar partner banner.", result.error.message);
    }
    return null;
  }

  return mapPartnerBanner(result.data.banner);
}

export async function getSiteImageAssets(): Promise<SiteImageAssets> {
  const result = await wpRest<WpSiteImagesResponse>(
    "/papelito/v1/site/image-assets",
    process.env.NODE_ENV === "development"
      ? {}
      : {
          revalidate: 60,
          tags: ["wp:site-image-assets"],
        },
  );

  if (!result.ok) {
    if (result.status !== 404) {
      console.warn("[site-image-assets] Falha ao consultar imagens do site.", result.error.message);
    }
    return SITE_IMAGE_DEFAULTS;
  }

  return mapSiteImages(result.data.images);
}
