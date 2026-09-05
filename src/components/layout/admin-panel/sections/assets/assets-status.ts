import { CircleAlert, CircleCheck, CircleDashed, CircleX, Pencil } from "lucide-react";

import type { StatusShape } from "@/components/layout/admin-panel/primitives";
import { isDefaultSiteImage } from "@/lib/site-images";
import { isDefaultLogo } from "@/lib/site-logos";
import type {
  HeroBanner,
  HomeFeatureItem,
  ManagedImageAsset,
  PartnerBannerConfig,
  PromoMarqueeItem,
  SiteImageAssetKey,
  SiteLogoKey,
} from "@/types/home-assets";

/**
 * `attention` separa o que precisa de trabalho do que só está num estado alternativo legítimo:
 * uma logo na versão padrão do projeto está correta, uma imagem ausente impede o salvamento.
 */
export type AssetStatus = StatusShape & { attention: boolean };

export const ASSET_STATUS = {
  active: { attention: false, icon: CircleCheck, label: "Ativa", tone: "positive" },
  configured: { attention: false, icon: CircleCheck, label: "Configurado", tone: "positive" },
  emptyText: { attention: true, icon: CircleX, label: "Sem texto", tone: "critical" },
  inactive: { attention: false, icon: CircleDashed, label: "Inativa", tone: "neutral" },
  loading: { attention: false, icon: CircleDashed, label: "Carregando", tone: "neutral" },
  incomplete: { attention: true, icon: CircleX, label: "Incompleto", tone: "critical" },
  missingAlt: { attention: true, icon: CircleAlert, label: "Sem texto alternativo", tone: "pending" },
  missingImage: { attention: true, icon: CircleX, label: "Imagem ausente", tone: "critical" },
  projectDefault: { attention: false, icon: CircleDashed, label: "Padrão do projeto", tone: "neutral" },
  unavailableFile: { attention: true, icon: CircleX, label: "Arquivo indisponível", tone: "critical" },
  unsaved: { attention: false, icon: Pencil, label: "Não salvo", tone: "pending" },
} satisfies Record<string, AssetStatus>;

function isBlank(value: string | null | undefined) {
  return (value ?? "").trim() === "";
}

export function imageAssetStatus(
  asset: ManagedImageAsset | undefined,
  key?: SiteImageAssetKey,
): AssetStatus {
  if (!asset || isBlank(asset.imageUrl)) {
    return ASSET_STATUS.missingImage;
  }

  if (key && isDefaultSiteImage(key, asset)) {
    return ASSET_STATUS.projectDefault;
  }

  return isBlank(asset.alt) ? ASSET_STATUS.missingAlt : ASSET_STATUS.configured;
}

export function logoStatus(key: SiteLogoKey, logo: ManagedImageAsset | undefined): AssetStatus {
  if (!logo || isBlank(logo.imageUrl)) {
    return ASSET_STATUS.missingImage;
  }

  if (isDefaultLogo(key, logo)) {
    return ASSET_STATUS.projectDefault;
  }

  return isBlank(logo.alt) ? ASSET_STATUS.missingAlt : ASSET_STATUS.configured;
}

export function heroBannerStatus(banner: HeroBanner): AssetStatus {
  if (isBlank(banner.desktopImageUrl) || isBlank(banner.mobileImageUrl)) {
    return ASSET_STATUS.missingImage;
  }

  return isBlank(banner.alt) ? ASSET_STATUS.missingAlt : ASSET_STATUS.configured;
}

export function partnerBannerStatus(banner: PartnerBannerConfig): AssetStatus {
  if (isBlank(banner.desktopImageUrl) || isBlank(banner.mobileImageUrl)) {
    return ASSET_STATUS.missingImage;
  }

  return isBlank(banner.alt) ? ASSET_STATUS.missingAlt : ASSET_STATUS.configured;
}

export function marqueeMessageStatus(message: PromoMarqueeItem): AssetStatus {
  if (isBlank(message.text)) {
    return ASSET_STATUS.emptyText;
  }

  return message.isActive ? ASSET_STATUS.active : ASSET_STATUS.inactive;
}

export function featureItemStatus(item: HomeFeatureItem): AssetStatus {
  if (isBlank(item.title) || isBlank(item.subtitle) || isBlank(item.iconUrl)) {
    return ASSET_STATUS.incomplete;
  }

  return ASSET_STATUS.configured;
}

export function countAttention(statuses: AssetStatus[]): number {
  return statuses.filter((status) => status.attention).length;
}

export function attentionSuffix(count: number): string {
  if (count <= 0) {
    return "";
  }

  return ` · ${count} precisa${count === 1 ? "" : "m"} de atenção`;
}
