import "server-only";

import { PROMO_MARQUEE_MIN_ACTIVE_MESSAGES } from "@/components/layout/promo-marquee/constants";
import { FEATURES_BAR_ITEMS } from "@/components/layout/features-bar/constants";
import { wpRest } from "@/lib/server/wp-rest";
import { SITE_LOGO_DEFAULTS, mapSiteLogos } from "@/lib/site-logos";
import type {
  HeroBanner,
  ManagedImageAsset,
  HomeFeatureItem,
  PartnerBannerConfig,
  PromoBannerConfig,
  PromoMarqueeItem,
  SiteImageAssetKey,
  SiteImageAssets,
  SiteLogoKey,
  SiteLogos,
} from "@/types/home-assets";

type WpHeroResponse = {
  banners?: Partial<HeroBanner>[];
};

type WpPromoResponse = {
  banner?: Partial<PromoBannerConfig>;
};

type WpPromoMarqueeResponse = {
  messages?: Partial<PromoMarqueeItem>[];
};

type WpFeaturesResponse = {
  items?: Partial<HomeFeatureItem>[];
};

type WpPartnerResponse = {
  banner?: Partial<PartnerBannerConfig>;
};

type WpSiteImagesResponse = {
  images?: Partial<Record<SiteImageAssetKey, Partial<ManagedImageAsset>>>;
};

type WpSiteLogosResponse = {
  logos?: Partial<Record<SiteLogoKey, Partial<ManagedImageAsset>>>;
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

function mapPromoMarqueeItem(
  item: Partial<PromoMarqueeItem> | undefined,
  index: number,
): PromoMarqueeItem | null {
  if (!item || typeof item.text !== "string" || item.text.trim() === "") {
    return null;
  }

  return {
    id: cleanText(item.id) || `marquee-${index + 1}`,
    text: item.text.trim(),
    order: toNumber(item.order) || index + 1,
    isActive: toBoolean(item.isActive),
  };
}

function mapHomeFeatureItem(
  item: Partial<HomeFeatureItem> | undefined,
  index: number,
): HomeFeatureItem | null {
  if (
    !item ||
    typeof item.title !== "string" ||
    typeof item.subtitle !== "string" ||
    typeof item.iconUrl !== "string" ||
    item.title.trim() === "" ||
    item.subtitle.trim() === "" ||
    item.iconUrl.trim() === ""
  ) {
    return null;
  }

  return {
    id: cleanText(item.id) || FEATURES_BAR_ITEMS[index]?.id || `feature-${index + 1}`,
    title: item.title.trim(),
    subtitle: item.subtitle.trim(),
    iconId: toNumber(item.iconId),
    iconUrl: item.iconUrl.trim(),
  };
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
  revendedorBusinessIllustration: {
    imageId: 0,
    imageUrl: "/images/revendedor/business-card-vector.svg",
    alt: "Ilustração de atendimento a negócios revendedores.",
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
    "Junte-se ao nosso PDV Perfeito com lojistas em todo o Brasil. Receba brindes, prêmios e benefícios exclusivos";
  const ctaLabel = cleanText(banner.ctaLabel) || "Quero ser um parceiro";
  const href = cleanText(banner.href) || "/revendedor";
  const alt = cleanText(banner.alt) || "Parceiros no espaço PDV Perfeito Papelito.";

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

export async function getHomePromoMarquee(): Promise<PromoMarqueeItem[]> {
  const result = await wpRest<WpPromoMarqueeResponse>(
    "/papelito/v1/home/promo-marquee",
    process.env.NODE_ENV === "development"
      ? {}
      : {
          revalidate: 60,
          tags: ["wp:home-promo-marquee"],
        },
  );

  if (!result.ok) {
    if (result.status !== 404) {
      console.warn("[home-promo-marquee] Falha ao consultar a faixa.", result.error.message);
    }

    return [];
  }

  if (!Array.isArray(result.data.messages)) {
    return [];
  }

  const activeMessages = result.data.messages
    .map((message, index) => mapPromoMarqueeItem(message, index))
    .filter((message): message is PromoMarqueeItem => message?.isActive === true)
    .sort((left, right) => left.order - right.order);

  return activeMessages.length >= PROMO_MARQUEE_MIN_ACTIVE_MESSAGES ? activeMessages : [];
}

export async function getHomeFeatures(): Promise<HomeFeatureItem[]> {
  const result = await wpRest<WpFeaturesResponse>(
    "/papelito/v1/home/features",
    process.env.NODE_ENV === "development"
      ? {}
      : {
          revalidate: 60,
          tags: ["wp:home-features"],
        },
  );

  if (!result.ok || !Array.isArray(result.data.items)) {
    if (!result.ok && result.status !== 404) {
      console.warn("[home-features] Falha ao consultar os benefícios.", result.error.message);
    }

    return FEATURES_BAR_ITEMS;
  }

  const items = result.data.items
    .map((item, index) => mapHomeFeatureItem(item, index))
    .filter((item): item is HomeFeatureItem => item !== null);

  return items.length === FEATURES_BAR_ITEMS.length ? items : FEATURES_BAR_ITEMS;
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

export async function getSiteLogos(): Promise<SiteLogos> {
  const result = await wpRest<WpSiteLogosResponse>(
    "/papelito/v1/site/logos",
    process.env.NODE_ENV === "development"
      ? {}
      : {
          revalidate: 60,
          tags: ["wp:site-logos"],
        },
  );

  if (!result.ok) {
    if (result.status !== 404) {
      console.warn("[site-logos] Falha ao consultar logos do site.", result.error.message);
    }
    return SITE_LOGO_DEFAULTS;
  }

  return mapSiteLogos(result.data.logos);
}
