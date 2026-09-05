import "server-only";

import { normalizeRichTextDocument } from "@/features/rich-text";
import { wpRest } from "@/lib/server/wp-rest";
import { SITE_IMAGE_DEFAULTS, SITE_IMAGE_KEYS } from "@/lib/site-images";
import { SITE_LOGO_DEFAULTS, mapSiteLogos } from "@/lib/site-logos";
import type {
  AdminHeroBannersSnapshot,
  AdminHomeFeaturesSnapshot,
  AdminPartnerBannerSnapshot,
  AdminPromoBannerSnapshot,
  AdminPromoMarqueeSnapshot,
  AdminSiteImageAssetsSnapshot,
  AdminSiteLogosSnapshot,
  HeroBanner,
  HomeFeatureItem,
  ManagedImageAsset,
  PartnerBannerConfig,
  PromoBannerConfig,
  PromoMarqueeItem,
  SiteImageAssets,
  SiteImageAssetKey,
  SiteLogoKey,
  SiteLogos,
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

type WpPromoMarqueeSnapshot = {
  messages?: Partial<PromoMarqueeItem>[];
  issues?: string[];
};

type WpFeaturesSnapshot = {
  items?: Partial<HomeFeatureItem>[];
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

type WpSiteLogosSnapshot = {
  logos?: Partial<Record<SiteLogoKey, Partial<ManagedImageAsset>>>;
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

function mapPromoMarqueeItem(
  item: Partial<PromoMarqueeItem> | null | undefined,
  index: number,
): PromoMarqueeItem | null {
  const content = normalizeRichTextDocument(item?.content);

  if (!item || typeof item.text !== "string" || (item.text.trim() === "" && content === null)) {
    return null;
  }

  return {
    id: cleanText(item.id) || `marquee-${index + 1}`,
    text: item.text,
    content,
    order: toNumber(item.order) || index + 1,
    isActive: toBoolean(item.isActive),
  };
}

function mapHomeFeatureItem(
  item: Partial<HomeFeatureItem> | null | undefined,
  index: number,
): HomeFeatureItem | null {
  if (
    !item ||
    typeof item.title !== "string" ||
    typeof item.subtitle !== "string" ||
    typeof item.iconUrl !== "string" ||
    item.title.trim() === "" ||
    (item.subtitle.trim() === "" && normalizeRichTextDocument(item.subtitleContent) === null) ||
    item.iconUrl.trim() === ""
  ) {
    return null;
  }

  return {
    id: cleanText(item.id) || `feature-${index + 1}`,
    title: item.title.trim(),
    subtitle: item.subtitle,
    subtitleContent: normalizeRichTextDocument(item.subtitleContent),
    iconId: toNumber(item.iconId),
    iconUrl: item.iconUrl.trim(),
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

export async function getAdminSiteLogosSnapshot(
  accessToken: string | undefined,
): Promise<AdminSiteLogosSnapshot> {
  if (!accessToken) {
    return {
      logos: SITE_LOGO_DEFAULTS,
      issues: ["Sessão sem access token para consultar logos do site."],
    };
  }

  const result = await wpRest<WpSiteLogosSnapshot>("/papelito/v1/admin/assets/logos", {
    headers: { Authorization: `Bearer ${accessToken}` },
    revalidate: 60,
    tags: ["admin-site-logos"],
  });

  if (!result.ok) {
    return {
      logos: SITE_LOGO_DEFAULTS,
      issues: [result.error.message],
    };
  }

  return {
    logos: mapSiteLogos(result.data.logos),
    issues: mapIssues(result.data.issues),
  };
}

export async function saveAdminSiteLogos(accessToken: string, logos: SiteLogos) {
  const result = await wpRest<WpSiteLogosSnapshot>("/papelito/v1/admin/assets/logos", {
    headers: { Authorization: `Bearer ${accessToken}` },
    json: { logos },
    method: "PUT",
  });

  if (!result.ok) {
    throw buildHttpError(result.error.message, result.status);
  }

  return {
    logos: mapSiteLogos(result.data.logos),
    issues: mapIssues(result.data.issues),
  } satisfies AdminSiteLogosSnapshot;
}

export async function restoreAdminSiteLogo(accessToken: string, key: SiteLogoKey) {
  const result = await wpRest<WpSiteLogosSnapshot>(
    `/papelito/v1/admin/assets/logos?key=${encodeURIComponent(key)}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
      method: "DELETE",
    },
  );

  if (!result.ok) {
    throw buildHttpError(result.error.message, result.status);
  }

  return {
    logos: mapSiteLogos(result.data.logos),
    issues: mapIssues(result.data.issues),
  } satisfies AdminSiteLogosSnapshot;
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

export async function getAdminPromoMarqueeSnapshot(
  accessToken: string | undefined,
): Promise<AdminPromoMarqueeSnapshot> {
  if (!accessToken) {
    return {
      messages: [],
      issues: ["Sessão sem access token para consultar a faixa de avisos."],
    };
  }

  const result = await wpRest<WpPromoMarqueeSnapshot>("/papelito/v1/admin/assets/promo-marquee", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!result.ok) {
    return {
      messages: [],
      issues: [result.error.message],
    };
  }

  return {
    messages: Array.isArray(result.data.messages)
      ? result.data.messages
          .map((message, index) => mapPromoMarqueeItem(message, index))
          .filter((message): message is PromoMarqueeItem => message !== null)
          .sort((left, right) => left.order - right.order)
      : [],
    issues: mapIssues(result.data.issues),
  };
}

export async function saveAdminPromoMarquee(accessToken: string, messages: PromoMarqueeItem[]) {
  const result = await wpRest<WpPromoMarqueeSnapshot>("/papelito/v1/admin/assets/promo-marquee", {
    headers: { Authorization: `Bearer ${accessToken}` },
    json: { messages },
    method: "PUT",
  });

  if (!result.ok) {
    throw buildHttpError(result.error.message, result.status);
  }

  return {
    messages: Array.isArray(result.data.messages)
      ? result.data.messages
          .map((message, index) => mapPromoMarqueeItem(message, index))
          .filter((message): message is PromoMarqueeItem => message !== null)
          .sort((left, right) => left.order - right.order)
      : [],
    issues: mapIssues(result.data.issues),
  } satisfies AdminPromoMarqueeSnapshot;
}

export async function getAdminHomeFeaturesSnapshot(
  accessToken: string | undefined,
): Promise<AdminHomeFeaturesSnapshot> {
  if (!accessToken) {
    return {
      items: [],
      issues: ["Sessão sem access token para consultar os benefícios da Home."],
    };
  }

  const result = await wpRest<WpFeaturesSnapshot>("/papelito/v1/admin/assets/features", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!result.ok) {
    return {
      items: [],
      issues: [result.error.message],
    };
  }

  return {
    items: Array.isArray(result.data.items)
      ? result.data.items
          .map((item, index) => mapHomeFeatureItem(item, index))
          .filter((item): item is HomeFeatureItem => item !== null)
      : [],
    issues: mapIssues(result.data.issues),
  };
}

export async function saveAdminHomeFeatures(accessToken: string, items: HomeFeatureItem[]) {
  const result = await wpRest<WpFeaturesSnapshot>("/papelito/v1/admin/assets/features", {
    headers: { Authorization: `Bearer ${accessToken}` },
    json: { items },
    method: "PUT",
  });

  if (!result.ok) {
    throw buildHttpError(result.error.message, result.status);
  }

  return {
    items: Array.isArray(result.data.items)
      ? result.data.items
          .map((item, index) => mapHomeFeatureItem(item, index))
          .filter((item): item is HomeFeatureItem => item !== null)
      : [],
    issues: mapIssues(result.data.issues),
  } satisfies AdminHomeFeaturesSnapshot;
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
