import type { ManagedImageAsset, SiteLogoKey, SiteLogos } from "@/types/home-assets";

export const SITE_LOGO_DEFAULTS: SiteLogos = {
  publicHeader: {
    imageId: 0,
    imageUrl: "/images/marketplacelogo.svg",
    alt: "Papelito",
  },
  privateHeader: {
    imageId: 0,
    imageUrl: "/images/marketplacelogo.svg",
    alt: "Marketplace Papelito",
  },
  footer: {
    imageId: 0,
    imageUrl: "/images/logo3.svg",
    alt: "Papelito",
  },
};

export const SITE_LOGO_KEYS = Object.keys(SITE_LOGO_DEFAULTS) as SiteLogoKey[];

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function toNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

export function mapSiteLogo(
  key: SiteLogoKey,
  logo: Partial<ManagedImageAsset> | null | undefined,
): ManagedImageAsset {
  const fallback = SITE_LOGO_DEFAULTS[key];

  return {
    imageId: toNumber(logo?.imageId),
    imageUrl: cleanText(logo?.imageUrl) || fallback.imageUrl,
    alt: cleanText(logo?.alt) || fallback.alt,
  };
}

export function mapSiteLogos(
  logos: Partial<Record<SiteLogoKey, Partial<ManagedImageAsset>>> | null | undefined,
): SiteLogos {
  return SITE_LOGO_KEYS.reduce((mapped, key) => {
    mapped[key] = mapSiteLogo(key, logos?.[key]);
    return mapped;
  }, {} as SiteLogos);
}

export function resolveLogo(
  key: SiteLogoKey,
  logo: ManagedImageAsset | null | undefined,
): ManagedImageAsset {
  return mapSiteLogo(key, logo);
}

export function isDefaultLogo(key: SiteLogoKey, logo: ManagedImageAsset): boolean {
  return logo.imageId === 0 && logo.imageUrl === SITE_LOGO_DEFAULTS[key].imageUrl;
}
