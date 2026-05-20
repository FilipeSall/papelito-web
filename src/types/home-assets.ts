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
  | "revendedorBusinessSecondary"
  | "revendedorBusinessIllustration";

export type SiteImageAssets = Record<SiteImageAssetKey, ManagedImageAsset>;

export type PromoBannerConfig = {
  ctaLabel: string;
  href: string;
  isActive: boolean;
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

export type AdminPromoBannerSnapshot = {
  banner: PromoBannerConfig;
  issues: string[];
};

export type AdminPartnerBannerSnapshot = {
  banner: PartnerBannerConfig;
  issues: string[];
};
