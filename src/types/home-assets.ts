import type { RichTextDocument } from "@/features/rich-text";

export type HeroBanner = {
  id: string;
  desktopImageId: number;
  desktopImageUrl: string;
  mobileImageId: number;
  mobileImageUrl: string;
  alt: string;
  href: string;
  order: number;
  isActive: boolean;
};

export type ManagedImageAsset = {
  imageId: number;
  imageUrl: string;
  alt: string;
};

export type SiteImageAssetKey =
  | "productHero"
  | "aboutHero"
  | "aboutStory"
  | "revendedorBusinessMain"
  | "revendedorBusinessSecondary";

export type SiteImageAssets = Record<SiteImageAssetKey, ManagedImageAsset>;

export type SiteLogoKey = "publicHeader" | "privateHeader" | "footer";

export type SiteLogos = Record<SiteLogoKey, ManagedImageAsset>;

export type PromoBannerConfig = {
  ctaLabel: string;
  href: string;
  isActive: boolean;
};

export type PromoMarqueeItem = {
  id: string;
  text: string;
  content: RichTextDocument | null;
  order: number;
  isActive: boolean;
};

export type CollectionNavItem = {
  id: string;
  title: string;
  subtitle: string;
  href: string;
  collectionId?: number;
  collectionData?: CollectionNavCollection;
  collection: string;
  indicatorKey?: CollectionIndicatorKey;
  highlight?: CollectionHighlight;
  indicatorOptions?: CollectionIndicatorOption[];
  order: number;
  isActive: boolean;
};

export type CollectionIndicatorKey =
  | "NONE"
  | "ITEM_COUNT"
  | "MAX_DISCOUNT_PERCENT"
  | "NEW_ITEMS_COUNT"
  | "ACTIVE_DEALS_COUNT";

export type CollectionHighlight = {
  label: string;
  text: string;
  value: number;
};

export type CollectionIndicatorOption = {
  key: CollectionIndicatorKey;
  label: string;
  description: string;
  preview: string;
};

export type CollectionIndicatorPolicy = {
  required: CollectionIndicatorKey | null;
  locked: boolean;
  allowed: CollectionIndicatorKey[];
};

export type CollectionNavCollection = {
  id: number;
  name: string;
  slug: string;
  imageAttachmentId: number;
  imageUrl: string;
  path: string;
  systemKey: string;
  isActive: boolean;
  indicatorPolicy?: CollectionIndicatorPolicy;
  indicatorOptions?: CollectionIndicatorOption[];
};

export type HomeFeatureItem = {
  id: string;
  title: string;
  subtitle: string;
  subtitleContent: RichTextDocument | null;
  iconId: number;
  iconUrl: string;
};

export type PartnerBannerConfig = {
  tag: string;
  description: string;
  ctaLabel: string;
  href: string;
  desktopImageId: number;
  desktopImageUrl: string;
  mobileImageId: number;
  mobileImageUrl: string;
  alt: string;
  isActive: boolean;
};

export type AdminHeroBannersSnapshot = {
  banners: HeroBanner[];
  issues: string[];
};

export type AdminSiteImageAssetsSnapshot = {
  images: SiteImageAssets;
  issues: string[];
};

export type AdminSiteLogosSnapshot = {
  logos: SiteLogos;
  issues: string[];
};

export type AdminPromoBannerSnapshot = {
  banner: PromoBannerConfig;
  issues: string[];
};

export type AdminPromoMarqueeSnapshot = {
  messages: PromoMarqueeItem[];
  issues: string[];
};

export type AdminCollectionsNavSnapshot = {
  items: CollectionNavItem[];
  collections?: CollectionNavCollection[];
  issues: string[];
};

export type AdminHomeFeaturesSnapshot = {
  items: HomeFeatureItem[];
  issues: string[];
};

export type AdminPartnerBannerSnapshot = {
  banner: PartnerBannerConfig;
  issues: string[];
};
