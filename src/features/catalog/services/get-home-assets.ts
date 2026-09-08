import "server-only";

import { PROMO_MARQUEE_MIN_ACTIVE_MESSAGES } from "@/lib/promo-marquee-limits";
import { normalizeRichTextDocument } from "@/features/rich-text";
import { FEATURES_BAR_ITEMS } from "@/lib/home-features";
import { COLLECTION_NAV_DEFAULTS } from "@/lib/home-collections-nav";
import { wpRest } from "@/lib/server/wp-rest";
import { SITE_IMAGE_DEFAULTS, SITE_IMAGE_KEYS } from "@/lib/site-images";
import { SITE_LOGO_DEFAULTS, mapSiteLogos } from "@/lib/site-logos";
import type {
  CollectionNavItem,
  CollectionNavCollection,
  CollectionIndicatorKey,
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

type WpCollectionsNavResponse = {
  items?: Partial<CollectionNavItem>[];
};

export type PublicCollection = Pick<CollectionNavCollection, "id" | "name" | "slug" | "imageUrl" | "path">;

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

function indicatorKey(value: unknown): CollectionIndicatorKey | undefined {
  return ["NONE", "ITEM_COUNT", "MAX_DISCOUNT_PERCENT", "NEW_ITEMS_COUNT", "ACTIVE_DEALS_COUNT"].includes(String(value)) ? String(value) as CollectionIndicatorKey : undefined;
}

function mapCollection(value: Partial<CollectionNavCollection> | undefined): CollectionNavCollection | undefined {
  if (!value) return undefined;
  return {
    id: toNumber(value.id), name: cleanText(value.name), slug: cleanText(value.slug),
    imageAttachmentId: toNumber(value.imageAttachmentId), imageUrl: cleanText(value.imageUrl),
    path: cleanText(value.path), systemKey: cleanText(value.systemKey), isActive: toBoolean(value.isActive),
    indicatorPolicy: value.indicatorPolicy ? { required: indicatorKey(value.indicatorPolicy.required) ?? null, locked: toBoolean(value.indicatorPolicy.locked), allowed: (value.indicatorPolicy.allowed ?? []).map(indicatorKey).filter(Boolean) as CollectionIndicatorKey[] } : undefined,
    indicatorOptions: Array.isArray(value.indicatorOptions) ? value.indicatorOptions.map((option) => ({ key: indicatorKey(option.key) ?? "NONE", label: cleanText(option.label), description: cleanText(option.description), preview: cleanText(option.preview) })) : undefined,
  };
}

function mapPromoMarqueeItem(
  item: Partial<PromoMarqueeItem> | undefined,
  index: number,
): PromoMarqueeItem | null {
  const content = normalizeRichTextDocument(item?.content);

  // Mensagem composta apenas por tokens tem texto puro vazio e mesmo assim é válida: o
  // WordPress aceita e o painel exibe. Sem esta condição ela sumiria só na vitrine.
  if (!item || typeof item.text !== "string" || (item.text.trim() === "" && content === null)) {
    return null;
  }

  return {
    id: cleanText(item.id) || `marquee-${index + 1}`,
    text: item.text.trim(),
    content,
    order: toNumber(item.order) || index + 1,
    isActive: toBoolean(item.isActive),
  };
}

function mapCollectionNavItem(
  item: Partial<CollectionNavItem> | undefined,
  index: number,
): CollectionNavItem | null {
  const title = cleanText(item?.title);
  const subtitle = cleanText(item?.subtitle);
  const href = cleanText(item?.href);

  // Card sem texto ou sem destino é atalho quebrado: sai sozinho em vez de derrubar o corredor.
  if (!item || title === "" || !href.startsWith("/")) {
    return null;
  }

  return {
    id: cleanText(item.id) || `collection-nav-${index + 1}`,
    title,
    subtitle,
    href,
    collectionId: toNumber(item.collectionId),
    collectionData: mapCollection(item.collectionData),
    collection: cleanText(item.collection),
    indicatorKey: indicatorKey(item.indicatorKey),
    highlight: item.highlight ? { label: cleanText(item.highlight.label), text: cleanText(item.highlight.text), value: toNumber(item.highlight.value) } : undefined,
    indicatorOptions: Array.isArray(item.indicatorOptions) ? item.indicatorOptions.map((option) => ({ key: indicatorKey(option.key) ?? "NONE", label: cleanText(option.label), description: cleanText(option.description), preview: cleanText(option.preview) })) : undefined,
    order: toNumber(item.order) || index + 1,
    isActive: toBoolean(item.isActive),
  };
}

function mapHomeFeatureItem(
  item: Partial<HomeFeatureItem> | undefined,
  index: number,
): HomeFeatureItem | null {
  const subtitleContent = normalizeRichTextDocument(item?.subtitleContent);

  if (
    !item ||
    typeof item.title !== "string" ||
    typeof item.subtitle !== "string" ||
    typeof item.iconUrl !== "string" ||
    item.title.trim() === "" ||
    (item.subtitle.trim() === "" && subtitleContent === null) ||
    item.iconUrl.trim() === ""
  ) {
    return null;
  }

  return {
    id: cleanText(item.id) || FEATURES_BAR_ITEMS[index]?.id || `feature-${index + 1}`,
    title: item.title.trim(),
    subtitle: item.subtitle.trim(),
    subtitleContent,
    iconId: toNumber(item.iconId),
    iconUrl: item.iconUrl.trim(),
  };
}


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

/**
 * Cards do corredor "Explore por coleção".
 *
 * Backend fora do ar cai no corredor de sempre — perder a seção inteira seria pior do que exibir
 * os quatro atalhos que existem desde o lançamento. Lista vazia devolvida com sucesso, ao
 * contrário, é decisão do admin e some da Home.
 */
export async function getHomeCollectionsNav(): Promise<CollectionNavItem[]> {
  const result = await wpRest<WpCollectionsNavResponse>(
    "/papelito/v1/home/collections-nav",
    process.env.NODE_ENV === "development"
      ? {}
      : {
          revalidate: 60,
          tags: ["wp:home-collections-nav"],
        },
  );

  if (!result.ok || !Array.isArray(result.data.items)) {
    if (!result.ok && result.status !== 404) {
      console.warn("[home-collections-nav] Falha ao consultar o corredor.", result.error.message);
    }

    return [...COLLECTION_NAV_DEFAULTS];
  }

  return result.data.items
    .map((item, index) => mapCollectionNavItem(item, index))
    .filter((item): item is CollectionNavItem => item?.isActive === true)
    .sort((left, right) => left.order - right.order);
}

export async function getPublicCollections(): Promise<PublicCollection[]> {
  const result = await wpRest<{ collections?: Partial<CollectionNavCollection>[] }>("/papelito/v1/categories", { revalidate: 60, tags: ["public-taxonomy"] });
  if (!result.ok || !Array.isArray(result.data.collections)) return [];
  return result.data.collections.map((collection) => ({ id: toNumber(collection.id), name: cleanText(collection.name), slug: cleanText(collection.slug), imageUrl: cleanText(collection.imageUrl), path: cleanText(collection.path) })).filter((collection) => collection.id > 0 && collection.slug !== "");
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
