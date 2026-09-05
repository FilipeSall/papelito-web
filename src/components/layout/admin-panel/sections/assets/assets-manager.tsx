"use client";

import { ExternalLink, Pencil } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import {
  AdminToast,
  InlineAlert,
  SectionHeading,
  useAdminToast,
} from "@/components/layout/admin-panel/primitives";
import { FEATURES_BAR_ITEMS } from "@/components/layout/features-bar/constants";
import { getHomeFeaturesValidation } from "@/components/layout/features-bar/home-features-validation";
import { getPromoMarqueeValidation } from "@/components/layout/promo-marquee/promo-marquee-validation";
import type { RichTextResolutionContext } from "@/features/rich-text";
import { useTemporaryAdminMedia } from "@/hooks/use-temporary-admin-media";
import { messageFromError } from "@/utils/error-message";
import type {
  AdminHeroBannersSnapshot,
  AdminHomeFeaturesSnapshot,
  AdminPartnerBannerSnapshot,
  AdminPromoMarqueeSnapshot,
  AdminSiteImageAssetsSnapshot,
  AdminSiteLogosSnapshot,
  HeroBanner,
  HomeFeatureItem,
  ManagedImageAsset,
  PartnerBannerConfig,
  PromoMarqueeItem,
  SiteImageAssetKey,
  SiteLogoKey,
} from "@/types/home-assets";

import type { AssetNoticeState } from "./asset-notice";
import { SECONDARY_ACTION_CLASS } from "./assets-classes";
import { assetsPageDefinition, type AssetsPageKey } from "./assets-config";
import { isSameAsset } from "./assets-dirty";
import { SITE_LOGO_FIELDS, siteImageFieldsFor } from "./assets-fields";
import {
  AssetsPageTabs,
  assetsPanelId,
  assetsTabId,
  type AssetsPageSummary,
} from "./assets-page-tabs";
import {
  countAttention,
  featureItemStatus,
  heroBannerStatus,
  imageAssetStatus,
  logoStatus,
  marqueeMessageStatus,
  partnerBannerStatus,
} from "./assets-status";
import { CatalogGroup } from "./groups/catalog-group";
import { FeaturesGroup } from "./groups/features-group";
import { HeroGroup } from "./groups/hero-group";
import { LogosGroup } from "./groups/logos-group";
import { MarqueeGroup } from "./groups/marquee-group";
import { PartnerGroup } from "./groups/partner-group";
import { SiteImagesGroup } from "./groups/site-images-group";
import { parseJson, uploadMedia } from "./upload-media";
import { useAssetsPage } from "./use-assets-page";

const HERO_API = "/api/admin/assets/hero-banners";
const PARTNER_API = "/api/admin/assets/partner-banner";
const SITE_IMAGES_API = "/api/admin/assets/site-images";
const LOGOS_API = "/api/admin/assets/logos";
const PROMO_MARQUEE_API = "/api/admin/assets/promo-marquee";
const HOME_FEATURES_API = "/api/admin/assets/features";

type AssetGroupKey = "features" | "hero" | "logos" | "marquee" | "partner" | "siteImages";

type AssetsManagerProps = {
  initialPage: AssetsPageKey;
  richTextContext: RichTextResolutionContext;
  initialFeaturesSnapshot: AdminHomeFeaturesSnapshot;
  initialHeroSnapshot: AdminHeroBannersSnapshot;
  initialLogosSnapshot: AdminSiteLogosSnapshot;
  initialPartnerSnapshot: AdminPartnerBannerSnapshot;
  initialPromoMarqueeSnapshot: AdminPromoMarqueeSnapshot;
  initialSiteImagesSnapshot: AdminSiteImageAssetsSnapshot;
};

const EMPTY_NOTICES: Record<AssetGroupKey, AssetNoticeState | null> = {
  features: null,
  hero: null,
  logos: null,
  marquee: null,
  partner: null,
  siteImages: null,
};

function createEmptyHeroBanner(index: number): HeroBanner {
  return {
    id:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `hero-${Date.now()}-${index + 1}`,
    desktopImageId: 0,
    desktopImageUrl: "",
    mobileImageId: 0,
    mobileImageUrl: "",
    alt: "",
    href: "",
    order: index + 1,
    isActive: true,
  };
}

function normalizeHeroOrder(banners: HeroBanner[]) {
  return banners.map((banner, index) => ({
    ...banner,
    isActive: true,
    order: index + 1,
  }));
}

function normalizePromoMarqueeOrder(messages: PromoMarqueeItem[]) {
  return messages.map((message, index) => ({
    ...message,
    order: index + 1,
  }));
}

function createEmptyPromoMarqueeItem(index: number): PromoMarqueeItem {
  return {
    id:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `marquee-${Date.now()}-${index + 1}`,
    text: "",
    content: null,
    order: index + 1,
    isActive: true,
  };
}

export function AssetsManager({
  initialPage,
  richTextContext,
  initialFeaturesSnapshot,
  initialHeroSnapshot,
  initialLogosSnapshot,
  initialPartnerSnapshot,
  initialPromoMarqueeSnapshot,
  initialSiteImagesSnapshot,
}: AssetsManagerProps) {
  const initialHeroBanners = normalizeHeroOrder(
    initialHeroSnapshot.banners.length > 0
      ? initialHeroSnapshot.banners
      : [createEmptyHeroBanner(0)],
  );
  const initialFeatureItems =
    initialFeaturesSnapshot.items.length === FEATURES_BAR_ITEMS.length
      ? initialFeaturesSnapshot.items
      : FEATURES_BAR_ITEMS;
  const initialPartner = { ...initialPartnerSnapshot.banner, isActive: true };

  const { activePage, selectPage } = useAssetsPage(initialPage);

  const [heroBanners, setHeroBanners] = useState(initialHeroBanners);
  const [persistedHeroBanners, setPersistedHeroBanners] = useState(initialHeroBanners);
  const [heroIssues, setHeroIssues] = useState(initialHeroSnapshot.issues);
  const [partnerBanner, setPartnerBanner] = useState<PartnerBannerConfig>(initialPartner);
  const [persistedPartnerBanner, setPersistedPartnerBanner] =
    useState<PartnerBannerConfig>(initialPartner);
  const [partnerIssues, setPartnerIssues] = useState(initialPartnerSnapshot.issues);
  const [promoMarquee, setPromoMarquee] = useState(() =>
    normalizePromoMarqueeOrder(initialPromoMarqueeSnapshot.messages),
  );
  const [persistedPromoMarquee, setPersistedPromoMarquee] = useState(() =>
    normalizePromoMarqueeOrder(initialPromoMarqueeSnapshot.messages),
  );
  const [promoMarqueeIssues, setPromoMarqueeIssues] = useState(
    initialPromoMarqueeSnapshot.issues,
  );
  const [features, setFeatures] = useState<HomeFeatureItem[]>(initialFeatureItems);
  const [persistedFeatures, setPersistedFeatures] =
    useState<HomeFeatureItem[]>(initialFeatureItems);
  const [featureIssues, setFeatureIssues] = useState(initialFeaturesSnapshot.issues);
  const [siteImages, setSiteImages] = useState(initialSiteImagesSnapshot.images);
  const [persistedSiteImages, setPersistedSiteImages] = useState(
    initialSiteImagesSnapshot.images,
  );
  const [siteImageIssues, setSiteImageIssues] = useState(initialSiteImagesSnapshot.issues);
  const [logos, setLogos] = useState(initialLogosSnapshot.logos);
  const [persistedLogos, setPersistedLogos] = useState(initialLogosSnapshot.logos);
  const [logoIssues, setLogoIssues] = useState(initialLogosSnapshot.issues);
  const [notices, setNotices] = useState(EMPTY_NOTICES);
  const [isSavingHero, setIsSavingHero] = useState(false);
  const [isSavingPartner, setIsSavingPartner] = useState(false);
  const [isSavingPromoMarquee, setIsSavingPromoMarquee] = useState(false);
  const [isSavingFeatures, setIsSavingFeatures] = useState(false);
  const [isSavingSiteImages, setIsSavingSiteImages] = useState(false);
  const [isSavingLogos, setIsSavingLogos] = useState(false);
  const [restoringLogoKey, setRestoringLogoKey] = useState<SiteLogoKey | null>(null);
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);
  const temporaryMedia = useTemporaryAdminMedia();
  const { dismissToast, isVisible, showToast, toast } = useAdminToast();
  const assetsSession = useRef(0);

  useEffect(() => {
    return () => {
      assetsSession.current += 1;
    };
  }, []);

  function setGroupNotice(group: AssetGroupKey, notice: AssetNoticeState | null) {
    setNotices((current) => ({ ...current, [group]: notice }));
  }

  function failGroup(group: AssetGroupKey, message: string) {
    setGroupNotice(group, { message, tone: "error" });
  }

  function informGroup(group: AssetGroupKey, message: string) {
    setGroupNotice(group, { message, tone: "success" });
  }

  function confirmSave(group: AssetGroupKey, title: string, description: string) {
    setGroupNotice(group, null);
    showToast({ description, title });
  }

  function updateHeroBanner(id: string, patch: Partial<HeroBanner>) {
    setHeroBanners((current) =>
      normalizeHeroOrder(
        current.map((banner) => (banner.id === id ? { ...banner, ...patch } : banner)),
      ),
    );
  }

  function moveHeroBanner(id: string, direction: -1 | 1) {
    setHeroBanners((current) => {
      const index = current.findIndex((banner) => banner.id === id);

      if (index < 0) {
        return current;
      }

      const nextIndex = index + direction;

      if (nextIndex < 0 || nextIndex >= current.length) {
        return current;
      }

      const clone = [...current];
      const [item] = clone.splice(index, 1);
      clone.splice(nextIndex, 0, item);
      return normalizeHeroOrder(clone);
    });
  }

  function removeHeroBanner(id: string) {
    if (heroBanners.length <= 1) {
      failGroup("hero", "A Hero Section precisa manter pelo menos uma opção.");
      return;
    }

    const removed = heroBanners.find((banner) => banner.id === id);
    const removedIds = [removed?.desktopImageId, removed?.mobileImageId].filter(
      (mediaId): mediaId is number => temporaryMedia.isTracked(mediaId),
    );
    if (removedIds.length > 0) {
      void temporaryMedia.discard(removedIds).catch(() => undefined);
    }

    setHeroBanners((current) =>
      normalizeHeroOrder(current.filter((banner) => banner.id !== id)),
    );
  }

  function addHeroBanner() {
    const banner = createEmptyHeroBanner(heroBanners.length);
    setHeroBanners((current) => normalizeHeroOrder([...current, banner]));
    return banner.id;
  }

  function updateSiteImage(key: SiteImageAssetKey, patch: Partial<ManagedImageAsset>) {
    setSiteImages((current) => ({
      ...current,
      [key]: {
        ...current[key],
        ...patch,
      },
    }));
  }

  function updateLogo(key: SiteLogoKey, patch: Partial<ManagedImageAsset>) {
    setLogos((current) => ({
      ...current,
      [key]: {
        ...current[key],
        ...patch,
      },
    }));
  }

  function updatePromoMarqueeItem(id: string, patch: Partial<PromoMarqueeItem>) {
    setPromoMarquee((current) =>
      current.map((message) => (message.id === id ? { ...message, ...patch } : message)),
    );
  }

  function updateFeatureItem(id: string, patch: Partial<HomeFeatureItem>) {
    setFeatures((current) =>
      current.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    );
  }

  function addPromoMarqueeItem() {
    const item = createEmptyPromoMarqueeItem(promoMarquee.length);
    setPromoMarquee((current) => normalizePromoMarqueeOrder([...current, item]));
    return item.id;
  }

  function movePromoMarqueeItem(id: string, direction: -1 | 1) {
    setPromoMarquee((current) => {
      const index = current.findIndex((message) => message.id === id);

      if (index < 0) {
        return current;
      }

      const nextIndex = index + direction;

      if (nextIndex < 0 || nextIndex >= current.length) {
        return current;
      }

      const clone = [...current];
      const [item] = clone.splice(index, 1);
      clone.splice(nextIndex, 0, item);
      return normalizePromoMarqueeOrder(clone);
    });
  }

  function removePromoMarqueeItem(id: string) {
    setPromoMarquee((current) =>
      normalizePromoMarqueeOrder(current.filter((message) => message.id !== id)),
    );
  }

  async function handleHeroUpload(id: string, field: "desktop" | "mobile", file: File) {
    const session = assetsSession.current;
    setUploadingKey(`hero:${id}:${field}`);
    setGroupNotice("hero", null);

    try {
      const media = await uploadMedia(file);
      if (session !== assetsSession.current) {
        void temporaryMedia.discard([media.id]).catch(() => undefined);
        return;
      }
      const current = heroBanners.find((banner) => banner.id === id);
      const previousId =
        field === "desktop" ? current?.desktopImageId : current?.mobileImageId;
      temporaryMedia.track(media.id);
      updateHeroBanner(id, {
        ...(field === "desktop"
          ? { desktopImageId: media.id, desktopImageUrl: media.src }
          : { mobileImageId: media.id, mobileImageUrl: media.src }),
        alt: media.alt || current?.alt || "",
      });
      if (temporaryMedia.isTracked(previousId)) {
        void temporaryMedia.discard([previousId!]).catch(() => undefined);
      }
      informGroup("hero", "Imagem enviada. Salve a Hero Section para publicar.");
    } catch (error) {
      failGroup(
        "hero",
        messageFromError(error, "Não foi possível enviar a imagem da Hero Section."),
      );
    } finally {
      setUploadingKey(null);
    }
  }

  async function handlePartnerUpload(field: "desktop" | "mobile", file: File) {
    const session = assetsSession.current;
    setUploadingKey(`partner:${field}`);
    setGroupNotice("partner", null);

    try {
      const media = await uploadMedia(file);
      if (session !== assetsSession.current) {
        void temporaryMedia.discard([media.id]).catch(() => undefined);
        return;
      }
      const previousId =
        field === "desktop" ? partnerBanner.desktopImageId : partnerBanner.mobileImageId;
      temporaryMedia.track(media.id);
      setPartnerBanner((current) => ({
        ...current,
        ...(field === "desktop"
          ? { desktopImageId: media.id, desktopImageUrl: media.src }
          : { mobileImageId: media.id, mobileImageUrl: media.src }),
        alt: media.alt || current.alt,
        isActive: true,
      }));
      if (temporaryMedia.isTracked(previousId)) {
        void temporaryMedia.discard([previousId!]).catch(() => undefined);
      }
      informGroup("partner", "Imagem enviada. Salve o PDV Perfeito para publicar.");
    } catch (error) {
      failGroup(
        "partner",
        messageFromError(error, "Não foi possível enviar a imagem do PDV Perfeito."),
      );
    } finally {
      setUploadingKey(null);
    }
  }

  async function handleSiteImageUpload(key: SiteImageAssetKey, file: File) {
    const session = assetsSession.current;
    setUploadingKey(`site:${key}`);
    setGroupNotice("siteImages", null);

    try {
      const media = await uploadMedia(file);
      if (session !== assetsSession.current) {
        void temporaryMedia.discard([media.id]).catch(() => undefined);
        return;
      }
      const previousId = siteImages[key].imageId;
      temporaryMedia.track(media.id);
      updateSiteImage(key, {
        imageId: media.id,
        imageUrl: media.src,
        alt: media.alt || siteImages[key].alt,
      });
      if (temporaryMedia.isTracked(previousId)) {
        void temporaryMedia.discard([previousId!]).catch(() => undefined);
      }
      informGroup("siteImages", "Imagem enviada. Salve as imagens do site para publicar.");
    } catch (error) {
      failGroup("siteImages", messageFromError(error, "Não foi possível enviar a imagem."));
    } finally {
      setUploadingKey(null);
    }
  }

  async function handleLogoUpload(key: SiteLogoKey, file: File) {
    const session = assetsSession.current;
    setUploadingKey(`logo:${key}`);
    setGroupNotice("logos", null);

    try {
      const media = await uploadMedia(file);
      if (session !== assetsSession.current) {
        void temporaryMedia.discard([media.id]).catch(() => undefined);
        return;
      }
      const previousId = logos[key].imageId;
      temporaryMedia.track(media.id);
      updateLogo(key, {
        imageId: media.id,
        imageUrl: media.src,
        alt: media.alt || logos[key].alt,
      });
      if (temporaryMedia.isTracked(previousId)) {
        void temporaryMedia.discard([previousId!]).catch(() => undefined);
      }
      informGroup("logos", "Logo enviada. Salve as logos para publicar.");
    } catch (error) {
      failGroup("logos", messageFromError(error, "Não foi possível enviar a logo."));
    } finally {
      setUploadingKey(null);
    }
  }

  async function handleFeatureIconUpload(id: string, file: File) {
    const session = assetsSession.current;
    const isSvg = file.name.toLowerCase().endsWith(".svg");
    const validMime = !file.type || file.type === "image/svg+xml";

    if (!isSvg || !validMime) {
      failGroup("features", "Selecione um arquivo SVG válido.");
      return;
    }

    if (file.size <= 0 || file.size > 2 * 1024 * 1024) {
      failGroup("features", "O SVG deve ter entre 1 byte e 2 MB.");
      return;
    }

    setUploadingKey(`feature:${id}`);
    setGroupNotice("features", null);

    try {
      const media = await uploadMedia(file);
      if (session !== assetsSession.current) {
        void temporaryMedia.discard([media.id]).catch(() => undefined);
        return;
      }
      const previousId = features.find((item) => item.id === id)?.iconId;
      temporaryMedia.track(media.id);
      updateFeatureItem(id, { iconId: media.id, iconUrl: media.src });
      if (temporaryMedia.isTracked(previousId)) {
        void temporaryMedia.discard([previousId!]).catch(() => undefined);
      }
      informGroup("features", "Ícone enviado. Salve os benefícios para publicar.");
    } catch (error) {
      failGroup(
        "features",
        messageFromError(error, "Não foi possível enviar o ícone do benefício."),
      );
    } finally {
      setUploadingKey(null);
    }
  }

  async function saveHeroBanners() {
    setIsSavingHero(true);
    temporaryMedia.beginSave();

    try {
      const response = await fetch(HERO_API, {
        body: JSON.stringify({ banners: normalizeHeroOrder(heroBanners) }),
        headers: { "Content-Type": "application/json" },
        method: "PUT",
      });
      const json = await parseJson<AdminHeroBannersSnapshot & { message?: string }>(response);

      if (!response.ok || !json) {
        throw new Error(json?.message ?? "Não foi possível salvar a Hero Section.");
      }

      const confirmed = normalizeHeroOrder(json.banners);
      setHeroBanners(confirmed);
      setPersistedHeroBanners(confirmed);
      temporaryMedia.commit(
        json.banners.flatMap((banner) => [banner.desktopImageId, banner.mobileImageId]),
      );
      setHeroIssues(Array.isArray(json.issues) ? json.issues : []);
      confirmSave("hero", "Hero Section atualizada", "As opções do topo da home já estão no ar.");
      return true;
    } catch (error) {
      failGroup("hero", messageFromError(error, "Não foi possível salvar a Hero Section."));
      return false;
    } finally {
      setIsSavingHero(false);
      temporaryMedia.endSave();
    }
  }

  async function savePartnerBanner() {
    setIsSavingPartner(true);
    temporaryMedia.beginSave();

    try {
      const response = await fetch(PARTNER_API, {
        body: JSON.stringify({ banner: { ...partnerBanner, isActive: true } }),
        headers: { "Content-Type": "application/json" },
        method: "PUT",
      });
      const json = await parseJson<AdminPartnerBannerSnapshot & { message?: string }>(response);

      if (!response.ok || !json) {
        throw new Error(json?.message ?? "Não foi possível salvar a imagem do PDV Perfeito.");
      }

      const confirmed = { ...json.banner, isActive: true };
      setPartnerBanner(confirmed);
      setPersistedPartnerBanner(confirmed);
      temporaryMedia.commit([json.banner.desktopImageId, json.banner.mobileImageId]);
      setPartnerIssues(Array.isArray(json.issues) ? json.issues : []);
      confirmSave(
        "partner",
        "PDV Perfeito atualizado",
        "O bloco de parceria da home já está no ar.",
      );
      return true;
    } catch (error) {
      failGroup(
        "partner",
        messageFromError(error, "Não foi possível salvar a imagem do PDV Perfeito."),
      );
      return false;
    } finally {
      setIsSavingPartner(false);
      temporaryMedia.endSave();
    }
  }

  async function saveSiteImages() {
    setIsSavingSiteImages(true);
    temporaryMedia.beginSave();

    try {
      const response = await fetch(SITE_IMAGES_API, {
        body: JSON.stringify({ images: siteImages }),
        headers: { "Content-Type": "application/json" },
        method: "PUT",
      });
      const json = await parseJson<AdminSiteImageAssetsSnapshot & { message?: string }>(response);

      if (!response.ok || !json) {
        throw new Error(json?.message ?? "Não foi possível salvar as imagens.");
      }

      setSiteImages(json.images);
      setPersistedSiteImages(json.images);
      temporaryMedia.commit(Object.values(json.images).map((image) => image.imageId));
      setSiteImageIssues(Array.isArray(json.issues) ? json.issues : []);
      confirmSave(
        "siteImages",
        "Imagens do site atualizadas",
        "Produtos, Sobre e Revendedor já usam as imagens novas.",
      );
      return true;
    } catch (error) {
      failGroup("siteImages", messageFromError(error, "Não foi possível salvar as imagens."));
      return false;
    } finally {
      setIsSavingSiteImages(false);
      temporaryMedia.endSave();
    }
  }

  async function saveLogos() {
    setIsSavingLogos(true);
    temporaryMedia.beginSave();

    try {
      const response = await fetch(LOGOS_API, {
        body: JSON.stringify({ logos }),
        headers: { "Content-Type": "application/json" },
        method: "PUT",
      });
      const json = await parseJson<AdminSiteLogosSnapshot & { message?: string }>(response);

      if (!response.ok || !json) {
        throw new Error(json?.message ?? "Não foi possível salvar as logos.");
      }

      setLogos(json.logos);
      setPersistedLogos(json.logos);
      temporaryMedia.commit(Object.values(json.logos).map((logo) => logo.imageId));
      setLogoIssues(Array.isArray(json.issues) ? json.issues : []);
      confirmSave(
        "logos",
        "Logos atualizadas",
        "O cabeçalho e o rodapé já usam as logos novas.",
      );
      return true;
    } catch (error) {
      failGroup("logos", messageFromError(error, "Não foi possível salvar as logos."));
      return false;
    } finally {
      setIsSavingLogos(false);
      temporaryMedia.endSave();
    }
  }

  async function savePromoMarquee() {
    if (isSavingPromoMarquee) {
      return false;
    }

    const validation = getPromoMarqueeValidation(promoMarquee);

    if (!validation.isValid) {
      failGroup("marquee", validation.message);
      return false;
    }

    const previousPersistedPromoMarquee = persistedPromoMarquee;
    setIsSavingPromoMarquee(true);

    try {
      const response = await fetch(PROMO_MARQUEE_API, {
        body: JSON.stringify({ messages: normalizePromoMarqueeOrder(promoMarquee) }),
        headers: { "Content-Type": "application/json" },
        method: "PUT",
      });
      const json = await parseJson<AdminPromoMarqueeSnapshot & { message?: string }>(response);

      if (!response.ok || !json) {
        throw new Error(json?.message ?? "Não foi possível salvar a faixa de avisos.");
      }

      const confirmedMessages = normalizePromoMarqueeOrder(json.messages);
      setPromoMarquee(confirmedMessages);
      setPersistedPromoMarquee(confirmedMessages);
      setPromoMarqueeIssues(Array.isArray(json.issues) ? json.issues : []);
      confirmSave(
        "marquee",
        "Faixa de avisos atualizada",
        "As mensagens ativas já aparecem no topo do site.",
      );
      return true;
    } catch (error) {
      setPromoMarquee(previousPersistedPromoMarquee);
      failGroup("marquee", messageFromError(error, "Não foi possível salvar a faixa de avisos."));
      return false;
    } finally {
      setIsSavingPromoMarquee(false);
    }
  }

  async function saveHomeFeatures() {
    if (isSavingFeatures) {
      return false;
    }

    const validation = getHomeFeaturesValidation(features);

    if (!validation.isValid) {
      failGroup("features", validation.message);
      return false;
    }

    const previousPersistedFeatures = persistedFeatures;
    setIsSavingFeatures(true);
    temporaryMedia.beginSave();

    try {
      const response = await fetch(HOME_FEATURES_API, {
        body: JSON.stringify({ items: features }),
        headers: { "Content-Type": "application/json" },
        method: "PUT",
      });
      const json = await parseJson<AdminHomeFeaturesSnapshot & { message?: string }>(response);

      if (!response.ok || !json) {
        throw new Error(json?.message ?? "Não foi possível salvar os benefícios da Home.");
      }

      const confirmedItems =
        json.items.length === FEATURES_BAR_ITEMS.length ? json.items : FEATURES_BAR_ITEMS;
      setFeatures(confirmedItems);
      setPersistedFeatures(confirmedItems);
      temporaryMedia.commit(confirmedItems.map((item) => item.iconId));
      setFeatureIssues(Array.isArray(json.issues) ? json.issues : []);
      confirmSave(
        "features",
        "Benefícios atualizados",
        "A faixa abaixo do Hero já mostra os textos novos.",
      );
      return true;
    } catch (error) {
      setFeatures(previousPersistedFeatures);
      failGroup(
        "features",
        messageFromError(error, "Não foi possível salvar os benefícios da Home."),
      );
      return false;
    } finally {
      setIsSavingFeatures(false);
      temporaryMedia.endSave();
    }
  }

  async function restoreLogo(key: SiteLogoKey) {
    const previousId = logos[key].imageId;
    setRestoringLogoKey(key);
    setGroupNotice("logos", null);

    try {
      const response = await fetch(`${LOGOS_API}?key=${encodeURIComponent(key)}`, {
        method: "DELETE",
      });
      const json = await parseJson<AdminSiteLogosSnapshot & { message?: string }>(response);

      if (!response.ok || !json) {
        throw new Error(json?.message ?? "Não foi possível restaurar a logo padrão.");
      }

      setLogos(json.logos);
      setPersistedLogos(json.logos);
      if (temporaryMedia.isTracked(previousId)) {
        void temporaryMedia.discard([previousId]).catch(() => undefined);
      }
      setLogoIssues(Array.isArray(json.issues) ? json.issues : []);
      confirmSave("logos", "Logo padrão restaurada", "A área voltou a usar a logo do projeto.");
    } catch (error) {
      failGroup("logos", messageFromError(error, "Não foi possível restaurar a logo padrão."));
    } finally {
      setRestoringLogoKey(null);
    }
  }

  const page = assetsPageDefinition(activePage);
  const produtosFields = siteImageFieldsFor("produtos");
  const sobreFields = siteImageFieldsFor("sobre");
  const revendedorFields = siteImageFieldsFor("revendedor");
  const activeImageFields = siteImageFieldsFor(activePage);

  function imagesAttention(fields: typeof produtosFields) {
    return countAttention(
      fields.map((field) => imageAssetStatus(siteImages[field.key], field.key)),
    );
  }

  function imagesDirty(fields: typeof produtosFields) {
    return fields.some(
      (field) => !isSameAsset(siteImages[field.key], persistedSiteImages[field.key]),
    );
  }

  const summaries: Record<AssetsPageKey, AssetsPageSummary> = {
    global: {
      attention: countAttention(
        SITE_LOGO_FIELDS.map((field) => logoStatus(field.key, logos[field.key])),
      ),
      total: SITE_LOGO_FIELDS.length,
    },
    home: {
      attention: countAttention([
        ...heroBanners.map(heroBannerStatus),
        ...promoMarquee.map(marqueeMessageStatus),
        ...features.map(featureItemStatus),
        partnerBannerStatus(partnerBanner),
      ]),
      total: heroBanners.length + promoMarquee.length + features.length + 1,
    },
    produtos: { attention: imagesAttention(produtosFields), total: produtosFields.length },
    revendedor: {
      attention: imagesAttention(revendedorFields),
      total: revendedorFields.length + 1,
    },
    sobre: { attention: imagesAttention(sobreFields), total: sobreFields.length },
  };

  const unsavedPages = [
    !isSameAsset(logos, persistedLogos) ? "Global" : null,
    !isSameAsset(heroBanners, persistedHeroBanners) ||
    !isSameAsset(promoMarquee, persistedPromoMarquee) ||
    !isSameAsset(features, persistedFeatures) ||
    !isSameAsset(partnerBanner, persistedPartnerBanner)
      ? "Home"
      : null,
    imagesDirty(produtosFields) ? "Produtos" : null,
    imagesDirty(sobreFields) ? "Sobre" : null,
    imagesDirty(revendedorFields) ? "Revendedor" : null,
  ].filter((label): label is string => label !== null);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <SectionHeading description={page.description} title={`Assets · ${page.label}`} />
        <a
          className={SECONDARY_ACTION_CLASS}
          href={page.publicHref}
          rel="noopener noreferrer"
          target="_blank"
        >
          <ExternalLink aria-hidden className="h-4 w-4" strokeWidth={2.4} />
          {page.publicLabel}
        </a>
      </div>

      <AssetsPageTabs activePage={activePage} onSelect={selectPage} summaries={summaries} />

      {unsavedPages.length > 0 ? (
        <InlineAlert icon={Pencil}>
          Alterações ainda não publicadas em {unsavedPages.join(", ")}. Use o botão de salvar do
          bloco correspondente.
        </InlineAlert>
      ) : null}

      <div
        aria-labelledby={assetsTabId(activePage)}
        className="space-y-5"
        id={assetsPanelId(activePage)}
        role="tabpanel"
      >
        {activePage === "global" ? (
          <LogosGroup
            isRestoring={restoringLogoKey}
            isSaving={isSavingLogos}
            issues={logoIssues}
            logos={logos}
            notice={notices.logos}
            onAltChange={(key, alt) => updateLogo(key, { alt })}
            onFileSelect={handleLogoUpload}
            onRestore={restoreLogo}
            onSave={saveLogos}
            persistedLogos={persistedLogos}
            uploadingKey={uploadingKey}
          />
        ) : null}

        {activePage === "home" ? (
          <>
            <HeroGroup
              banners={heroBanners}
              isSaving={isSavingHero}
              issues={heroIssues}
              notice={notices.hero}
              onAdd={addHeroBanner}
              onChange={updateHeroBanner}
              onFileSelect={handleHeroUpload}
              onMove={moveHeroBanner}
              onRemove={removeHeroBanner}
              onSave={saveHeroBanners}
              persistedBanners={persistedHeroBanners}
              uploadingKey={uploadingKey}
            />

            <MarqueeGroup
              isSaving={isSavingPromoMarquee}
              issues={promoMarqueeIssues}
              messages={promoMarquee}
              notice={notices.marquee}
              onAdd={addPromoMarqueeItem}
              onChange={updatePromoMarqueeItem}
              onMove={movePromoMarqueeItem}
              onRemove={removePromoMarqueeItem}
              onSave={savePromoMarquee}
              persistedMessages={persistedPromoMarquee}
              richTextContext={richTextContext}
            />

            <FeaturesGroup
              isSaving={isSavingFeatures}
              issues={featureIssues}
              items={features}
              notice={notices.features}
              onChange={updateFeatureItem}
              onSave={saveHomeFeatures}
              onUploadIcon={handleFeatureIconUpload}
              persistedItems={persistedFeatures}
              richTextContext={richTextContext}
              uploadingId={
                uploadingKey?.startsWith("feature:")
                  ? uploadingKey.slice("feature:".length)
                  : null
              }
            />

            <PartnerGroup
              banner={partnerBanner}
              isSaving={isSavingPartner}
              issues={partnerIssues}
              notice={notices.partner}
              onChange={(patch) => setPartnerBanner((current) => ({ ...current, ...patch }))}
              onFileSelect={handlePartnerUpload}
              onSave={savePartnerBanner}
              persistedBanner={persistedPartnerBanner}
              uploadingKey={uploadingKey}
            />
          </>
        ) : null}

        {activeImageFields.length > 0 ? (
          <SiteImagesGroup
            eyebrow={`Painel admin · Assets · ${page.label}`}
            fields={activeImageFields}
            images={siteImages}
            isSaving={isSavingSiteImages}
            issues={siteImageIssues}
            notice={notices.siteImages}
            onAltChange={(key, alt) => updateSiteImage(key, { alt })}
            onFileSelect={handleSiteImageUpload}
            onSave={saveSiteImages}
            persistedImages={persistedSiteImages}
            uploadingKey={uploadingKey}
          />
        ) : null}

        {activePage === "revendedor" ? <CatalogGroup /> : null}
      </div>

      <AdminToast
        description={toast?.description ?? ""}
        onClose={dismissToast}
        title={toast?.title ?? ""}
        visible={isVisible}
      />
    </div>
  );
}
