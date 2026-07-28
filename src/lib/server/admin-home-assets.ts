import "server-only";

import { wpRest } from "@/lib/server/wp-rest";
import type {
  AdminHeroBannersSnapshot,
  AdminPartnerBannerSnapshot,
  AdminPromoBannerSnapshot,
  AdminSiteImageAssetsSnapshot,
  HeroBanner,
  ManagedImageAsset,
  PartnerBannerConfig,
  PromoBannerConfig,
  SiteImageAssets,
  SiteImageAssetKey,
} from "@/types/home-assets";

type HttpError = Error & {
  status?: number;
};

type WpHeroBanner = Partial<HeroBanner>;
type WpPromoBanner = Partial<PromoBannerConfig>;
type WpPartnerBanner = Partial<PartnerBannerConfig>;

type WpHeroSnapshot = {
  banners?: WpHeroBanner[];
  issues?: string[];
};

type WpPromoSnapshot = {
  banner?: WpPromoBanner;
  issues?: string[];
};

type WpPartnerSnapshot = {
  banner?: WpPartnerBanner;
  issues?: string[];
};

type WpSiteImagesSnapshot = {
  images?: Partial<Record<SiteImageAssetKey, Partial<ManagedImageAsset>>>;
  issues?: string[];
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

function mapHeroBanner(banner: WpHeroBanner | null | undefined, index: number): HeroBanner | null {
  if (!banner) {
    return null;
  }

  const id = cleanText(banner.id) || `hero-${index + 1}`;

  return {
    id,
    desktopImageId: toNumber(banner.desktopImageId),
    desktopImageUrl: cleanText(banner.desktopImageUrl),
    mobileImageId: toNumber(banner.mobileImageId),
    mobileImageUrl: cleanText(banner.mobileImageUrl),
    alt: cleanText(banner.alt),
    href: cleanText(banner.href),
    order: toNumber(banner.order) || index + 1,
    isActive: toBoolean(banner.isActive),
  };
}

function emptyPromoBanner(): PromoBannerConfig {
  return {
    ctaLabel: "",
    href: "",
    isActive: false,
  };
}

function emptyPartnerBanner(): PartnerBannerConfig {
  return {
    tag: "Seja um parceiro",
    description:
      "Junte-se ao nosso PDV Perfeito com lojistas em todo o Brasil. Receba brindes, prêmios e benefícios exclusivos",
    ctaLabel: "Quero ser um parceiro",
    href: "/revendedor",
    desktopImageId: 0,
    desktopImageUrl: "/images/CT1A3510%201.png",
    mobileImageId: 0,
    mobileImageUrl: "/images/pdv-mobile.jpg",
    alt: "Parceiros no espaço PDV Perfeito Papelito.",
    isActive: true,
  };
}

function mapPromoBanner(banner: WpPromoBanner | null | undefined): PromoBannerConfig {
  if (!banner) {
    return emptyPromoBanner();
  }

  return {
    ctaLabel: cleanText(banner.ctaLabel),
    href: cleanText(banner.href),
    isActive: toBoolean(banner.isActive),
  };
}

function mapPartnerBanner(banner: WpPartnerBanner | null | undefined): PartnerBannerConfig {
  const fallback = emptyPartnerBanner();

  if (!banner) {
    return fallback;
  }

  return {
    tag: cleanText(banner.tag) || fallback.tag,
    description: cleanText(banner.description) || fallback.description,
    ctaLabel: cleanText(banner.ctaLabel) || fallback.ctaLabel,
    href: cleanText(banner.href) || fallback.href,
    desktopImageId: toNumber(banner.desktopImageId),
    desktopImageUrl: cleanText(banner.desktopImageUrl) || fallback.desktopImageUrl,
    mobileImageId: toNumber(banner.mobileImageId),
    mobileImageUrl: cleanText(banner.mobileImageUrl) || fallback.mobileImageUrl,
    alt: cleanText(banner.alt) || fallback.alt,
    isActive: toBoolean(banner.isActive) || fallback.isActive,
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

function mapSiteImages(images: WpSiteImagesSnapshot["images"] | null | undefined): SiteImageAssets {
  return SITE_IMAGE_KEYS.reduce((mapped, key) => {
    mapped[key] = mapImageAsset(key, images?.[key]);
    return mapped;
  }, {} as SiteImageAssets);
}

function mapIssues(issues: unknown) {
  return Array.isArray(issues)
    ? issues.filter((issue): issue is string => typeof issue === "string" && issue.trim().length > 0)
    : [];
}

function buildHttpError(message: string, status: number): HttpError {
  const error = new Error(message) as HttpError;
  error.status = status;
  return error;
}

export async function getAdminHeroBannersSnapshot(
  accessToken: string | undefined,
): Promise<AdminHeroBannersSnapshot> {
  if (!accessToken) {
    return {
      banners: [],
      issues: ["Sessão sem access token para consultar hero banners."],
    };
  }

  const result = await wpRest<WpHeroSnapshot>("/papelito/v1/admin/assets/hero-banners", {
    headers: { Authorization: `Bearer ${accessToken}` },
    revalidate: 60,
    tags: ["admin-home-hero-banners"],
  });

  if (!result.ok) {
    return {
      banners: [],
      issues: [result.error.message],
    };
  }

  return {
    banners: Array.isArray(result.data.banners)
      ? result.data.banners
          .map((banner, index) => mapHeroBanner(banner, index))
          .filter((banner): banner is HeroBanner => banner !== null)
      : [],
    issues: mapIssues(result.data.issues),
  };
}

export async function saveAdminHeroBanners(accessToken: string, banners: HeroBanner[]) {
  const result = await wpRest<WpHeroSnapshot>("/papelito/v1/admin/assets/hero-banners", {
    headers: { Authorization: `Bearer ${accessToken}` },
    json: { banners },
    method: "PUT",
  });

  if (!result.ok) {
    throw buildHttpError(result.error.message, result.status);
  }

  return {
    banners: Array.isArray(result.data.banners)
      ? result.data.banners
          .map((banner, index) => mapHeroBanner(banner, index))
          .filter((banner): banner is HeroBanner => banner !== null)
      : [],
    issues: mapIssues(result.data.issues),
  } satisfies AdminHeroBannersSnapshot;
}

export async function getAdminSiteImageAssetsSnapshot(
  accessToken: string | undefined,
): Promise<AdminSiteImageAssetsSnapshot> {
  if (!accessToken) {
    return {
      images: SITE_IMAGE_DEFAULTS,
      issues: ["Sessão sem access token para consultar imagens do site."],
    };
  }

  const result = await wpRest<WpSiteImagesSnapshot>("/papelito/v1/admin/assets/site-images", {
    headers: { Authorization: `Bearer ${accessToken}` },
    revalidate: 60,
    tags: ["admin-site-image-assets"],
  });

  if (!result.ok) {
    return {
      images: SITE_IMAGE_DEFAULTS,
      issues: [result.error.message],
    };
  }

  return {
    images: mapSiteImages(result.data.images),
    issues: mapIssues(result.data.issues),
  };
}

export async function saveAdminSiteImageAssets(accessToken: string, images: SiteImageAssets) {
  const result = await wpRest<WpSiteImagesSnapshot>("/papelito/v1/admin/assets/site-images", {
    headers: { Authorization: `Bearer ${accessToken}` },
    json: { images },
    method: "PUT",
  });

  if (!result.ok) {
    throw buildHttpError(result.error.message, result.status);
  }

  return {
    images: mapSiteImages(result.data.images),
    issues: mapIssues(result.data.issues),
  } satisfies AdminSiteImageAssetsSnapshot;
}

export async function getAdminPromoBannerSnapshot(
  accessToken: string | undefined,
): Promise<AdminPromoBannerSnapshot> {
  if (!accessToken) {
    return {
      banner: emptyPromoBanner(),
      issues: ["Sessão sem access token para consultar promo banner."],
    };
  }

  const result = await wpRest<WpPromoSnapshot>("/papelito/v1/admin/assets/promo-banner", {
    headers: { Authorization: `Bearer ${accessToken}` },
    revalidate: 60,
    tags: ["admin-home-promo-banner"],
  });

  if (!result.ok) {
    return {
      banner: emptyPromoBanner(),
      issues: [result.error.message],
    };
  }

  return {
    banner: mapPromoBanner(result.data.banner),
    issues: mapIssues(result.data.issues),
  };
}

export async function saveAdminPromoBanner(accessToken: string, banner: PromoBannerConfig) {
  const result = await wpRest<WpPromoSnapshot>("/papelito/v1/admin/assets/promo-banner", {
    headers: { Authorization: `Bearer ${accessToken}` },
    json: { banner },
    method: "PUT",
  });

  if (!result.ok) {
    throw buildHttpError(result.error.message, result.status);
  }

  return {
    banner: mapPromoBanner(result.data.banner),
    issues: mapIssues(result.data.issues),
  } satisfies AdminPromoBannerSnapshot;
}

export async function getAdminPartnerBannerSnapshot(
  accessToken: string | undefined,
): Promise<AdminPartnerBannerSnapshot> {
  if (!accessToken) {
    return {
      banner: emptyPartnerBanner(),
      issues: ["Sessão sem access token para consultar partner banner."],
    };
  }

  const result = await wpRest<WpPartnerSnapshot>("/papelito/v1/admin/assets/partner-banner", {
    headers: { Authorization: `Bearer ${accessToken}` },
    revalidate: 60,
    tags: ["admin-home-partner-banner"],
  });

  if (!result.ok) {
    return {
      banner: emptyPartnerBanner(),
      issues: [result.error.message],
    };
  }

  return {
    banner: mapPartnerBanner(result.data.banner),
    issues: mapIssues(result.data.issues),
  };
}

export async function saveAdminPartnerBanner(accessToken: string, banner: PartnerBannerConfig) {
  const result = await wpRest<WpPartnerSnapshot>("/papelito/v1/admin/assets/partner-banner", {
    headers: { Authorization: `Bearer ${accessToken}` },
    json: { banner },
    method: "PUT",
  });

  if (!result.ok) {
    throw buildHttpError(result.error.message, result.status);
  }

  return {
    banner: mapPartnerBanner(result.data.banner),
    issues: mapIssues(result.data.issues),
  } satisfies AdminPartnerBannerSnapshot;
}
