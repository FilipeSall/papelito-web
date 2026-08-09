"use client";

import { ArrowDown, ArrowUp, ChevronDown, ImagePlus, LoaderCircle, Save, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

import { CollapsiblePanel } from "@/components/layout/admin-panel/primitives";
import { FEATURES_BAR_ITEMS } from "@/components/layout/features-bar/constants";
import { getHomeFeaturesValidation } from "@/components/layout/features-bar/home-features-validation";
import { getPromoMarqueeValidation } from "@/components/layout/promo-marquee/promo-marquee-validation";
import type { RichTextResolutionContext } from "@/features/rich-text";
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
  PromoMarqueeItem,
  SiteImageAssetKey,
  SiteLogoKey,
} from "@/types/home-assets";

import {
  ALERT_ERROR_CLASS,
  ALERT_SUCCESS_CLASS,
  BUTTON_CLASS,
  CARD_CLASS,
  CARD_HEADER_CLASS,
  COMPACT_BUTTON_CLASS,
  DESTRUCTIVE_BUTTON_CLASS,
  ICON_BUTTON_CLASS,
  INPUT_CLASS,
  LABEL_CLASS,
  MUTED_TEXT_CLASS,
  SECONDARY_BUTTON_CLASS,
  TEXTAREA_CLASS,
} from "./field-classes";
import { ImageAssetCard, type ImageFieldConfig } from "./image-asset-card";
import { IssuesList } from "./issues-list";
import { LogosSection } from "./logos-section";
import { CatalogPdfManager } from "../catalog-pdf-manager";
import { PromoMarqueeSection } from "./promo-marquee-section";
import { UploadCard } from "./upload-card";
import { parseJson, uploadMedia } from "./upload-media";

const HERO_API = "/api/admin/assets/hero-banners";
const PARTNER_API = "/api/admin/assets/partner-banner";
const SITE_IMAGES_API = "/api/admin/assets/site-images";
const LOGOS_API = "/api/admin/assets/logos";
const PROMO_MARQUEE_API = "/api/admin/assets/promo-marquee";
const HOME_FEATURES_API = "/api/admin/assets/features";

type AssetsManagerProps = {
  richTextContext: RichTextResolutionContext;
  initialFeaturesSnapshot: AdminHomeFeaturesSnapshot;
  initialHeroSnapshot: AdminHeroBannersSnapshot;
  initialLogosSnapshot: AdminSiteLogosSnapshot;
  initialPartnerSnapshot: AdminPartnerBannerSnapshot;
  initialPromoMarqueeSnapshot: AdminPromoMarqueeSnapshot;
  initialSiteImagesSnapshot: AdminSiteImageAssetsSnapshot;
};

type NoticeTone = "error" | "success";

type NoticeState = {
  message: string;
  tone: NoticeTone;
};

const SITE_IMAGE_FIELDS: ImageFieldConfig[] = [
  {
    key: "productHero",
    eyebrow: "Produtos",
    title: "Imagem de produtos",
    description: "Banner do topo da página /produtos, atrás do título Nossos Produtos.",
    formatHint: "Formato ideal: horizontal largo, aproximadamente 3.5:1.",
  },
  {
    key: "aboutHero",
    eyebrow: "Sobre",
    title: "Banner da página Sobre",
    description: "Imagem larga no topo da página /sobre.",
    formatHint: "Formato ideal: horizontal, aproximadamente 16:10.",
  },
  {
    key: "aboutStory",
    eyebrow: "Sobre",
    title: "Imagem da história",
    description: 'Foto ao lado do bloco "Mais de uma década de história" na página /sobre.',
    formatHint: "Formato ideal: foto horizontal 3:2 com assunto central.",
  },
  {
    key: "revendedorBusinessMain",
    eyebrow: "Revendedor",
    title: "Imagem principal dos negócios",
    description: 'Foto grande ao lado do título "Atendemos Diferentes Tipos de Negócios!" em /revendedor.',
    formatHint: "Formato ideal: foto vertical 2:3 com foco no centro.",
  },
  {
    key: "revendedorBusinessSecondary",
    eyebrow: "Revendedor",
    title: "Imagem secundária dos negócios",
    description: "Foto menor do mosaico de negócios atendidos em /revendedor.",
    formatHint: "Formato ideal: foto horizontal ou vertical com crop seguro no centro.",
  },
  {
    key: "revendedorBusinessIllustration",
    eyebrow: "Revendedor",
    title: "Ilustração do card amarelo",
    description: "Imagem do card amarelo no mosaico de negócios atendidos em /revendedor.",
    formatHint: "Formato ideal: quadrado 1:1, PNG ou SVG com fundo transparente.",
    previewClass: "object-contain bg-brand-yellow",
  },
];

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
  richTextContext,
  initialFeaturesSnapshot,
  initialHeroSnapshot,
  initialLogosSnapshot,
  initialPartnerSnapshot,
  initialPromoMarqueeSnapshot,
  initialSiteImagesSnapshot,
}: AssetsManagerProps) {
  const [heroBanners, setHeroBanners] = useState(() =>
    normalizeHeroOrder(
      initialHeroSnapshot.banners.length > 0 ? initialHeroSnapshot.banners : [createEmptyHeroBanner(0)],
    ),
  );
  const [heroIssues, setHeroIssues] = useState(initialHeroSnapshot.issues);
  const [expandedHeroBannerIds, setExpandedHeroBannerIds] = useState<string[]>([]);
  const [isHeroPanelOpen, setIsHeroPanelOpen] = useState(false);
  const [pendingHeroBannerId, setPendingHeroBannerId] = useState<string | null>(null);
  const [partnerBanner, setPartnerBanner] = useState(() => ({
    ...initialPartnerSnapshot.banner,
    isActive: true,
  }));
  const [partnerIssues, setPartnerIssues] = useState(initialPartnerSnapshot.issues);
  const [isPartnerEditorOpen, setIsPartnerEditorOpen] = useState(false);
  const [promoMarquee, setPromoMarquee] = useState(() =>
    normalizePromoMarqueeOrder(initialPromoMarqueeSnapshot.messages),
  );
  const [persistedPromoMarquee, setPersistedPromoMarquee] = useState(() =>
    normalizePromoMarqueeOrder(initialPromoMarqueeSnapshot.messages),
  );
  const [promoMarqueeIssues, setPromoMarqueeIssues] = useState(initialPromoMarqueeSnapshot.issues);
  const [features, setFeatures] = useState<HomeFeatureItem[]>(() =>
    initialFeaturesSnapshot.items.length === FEATURES_BAR_ITEMS.length
      ? initialFeaturesSnapshot.items
      : FEATURES_BAR_ITEMS,
  );
  const [persistedFeatures, setPersistedFeatures] = useState<HomeFeatureItem[]>(() =>
    initialFeaturesSnapshot.items.length === FEATURES_BAR_ITEMS.length
      ? initialFeaturesSnapshot.items
      : FEATURES_BAR_ITEMS,
  );
  const [featureIssues, setFeatureIssues] = useState(initialFeaturesSnapshot.issues);
  const [siteImages, setSiteImages] = useState(initialSiteImagesSnapshot.images);
  const [siteImageIssues, setSiteImageIssues] = useState(initialSiteImagesSnapshot.issues);
  const [logos, setLogos] = useState(initialLogosSnapshot.logos);
  const [logoIssues, setLogoIssues] = useState(initialLogosSnapshot.issues);
  const [notice, setNotice] = useState<NoticeState | null>(null);
  const [isSavingHero, setIsSavingHero] = useState(false);
  const [isSavingPartner, setIsSavingPartner] = useState(false);
  const [isSavingPromoMarquee, setIsSavingPromoMarquee] = useState(false);
  const [isSavingFeatures, setIsSavingFeatures] = useState(false);
  const [isSavingSiteImages, setIsSavingSiteImages] = useState(false);
  const [isSavingLogos, setIsSavingLogos] = useState(false);
  const [restoringLogoKey, setRestoringLogoKey] = useState<SiteLogoKey | null>(null);
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);

  function showNotice(tone: NoticeTone, message: string) {
    setNotice({ message, tone });
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
    setHeroBanners((current) => {
      if (current.length <= 1) {
        showNotice("error", "A Hero Section precisa manter pelo menos uma opção.");
        return current;
      }

      return normalizeHeroOrder(current.filter((banner) => banner.id !== id));
    });
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
    setPromoMarquee((current) => [...current, item]);
    return item.id;
  }

  function addHeroBanner() {
    const banner = createEmptyHeroBanner(heroBanners.length);
    setHeroBanners((current) => [...current, banner]);
    setExpandedHeroBannerIds((current) => [...current, banner.id]);
    setIsHeroPanelOpen(true);
    setPendingHeroBannerId(banner.id);
  }

  useEffect(() => {
    if (!pendingHeroBannerId) {
      return;
    }

    const card = document.getElementById(`hero-option-card-${pendingHeroBannerId}`);
    const editor = document.getElementById(`hero-alt-${pendingHeroBannerId}`);
    if (!card || !editor) {
      return;
    }

    card.scrollIntoView?.({ behavior: "smooth", block: "center" });
    editor.focus({ preventScroll: true });
    setPendingHeroBannerId(null);
  }, [heroBanners, pendingHeroBannerId]);

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
    if (!window.confirm("Remover esta mensagem da faixa?")) {
      return;
    }

    setPromoMarquee((current) => normalizePromoMarqueeOrder(current.filter((message) => message.id !== id)));
  }

  async function handleHeroUpload(id: string, field: "desktop" | "mobile", file: File) {
    const uploadSlot = `hero:${id}:${field}`;
    setUploadingKey(uploadSlot);

    try {
      const media = await uploadMedia(file);
      updateHeroBanner(id, {
        ...(field === "desktop"
          ? { desktopImageId: media.id, desktopImageUrl: media.src }
          : { mobileImageId: media.id, mobileImageUrl: media.src }),
        alt: media.alt || heroBanners.find((banner) => banner.id === id)?.alt || "",
      });
      showNotice("success", "Imagem da Hero Section enviada com sucesso.");
    } catch (error) {
      showNotice("error", messageFromError(error, "Não foi possível enviar a imagem da Hero Section."));
    } finally {
      setUploadingKey(null);
    }
  }

  async function handlePartnerUpload(field: "desktop" | "mobile", file: File) {
    const uploadSlot = `partner:${field}`;
    setUploadingKey(uploadSlot);

    try {
      const media = await uploadMedia(file);
      setPartnerBanner((current) => ({
        ...current,
        ...(field === "desktop"
          ? { desktopImageId: media.id, desktopImageUrl: media.src }
          : { mobileImageId: media.id, mobileImageUrl: media.src }),
        alt: media.alt || current.alt,
        isActive: true,
      }));
      showNotice("success", "Imagem do PDV Perfeito enviada com sucesso.");
    } catch (error) {
      showNotice("error", messageFromError(error, "Não foi possível enviar a imagem do PDV Perfeito."));
    } finally {
      setUploadingKey(null);
    }
  }

  async function handleSiteImageUpload(key: SiteImageAssetKey, file: File) {
    const uploadSlot = `site:${key}`;
    setUploadingKey(uploadSlot);

    try {
      const media = await uploadMedia(file);
      updateSiteImage(key, {
        imageId: media.id,
        imageUrl: media.src,
        alt: media.alt || siteImages[key].alt,
      });
      showNotice("success", "Imagem enviada com sucesso.");
    } catch (error) {
      showNotice("error", messageFromError(error, "Não foi possível enviar a imagem."));
    } finally {
      setUploadingKey(null);
    }
  }

  async function handleLogoUpload(key: SiteLogoKey, file: File) {
    const uploadSlot = `logo:${key}`;
    setUploadingKey(uploadSlot);

    try {
      const media = await uploadMedia(file);
      updateLogo(key, {
        imageId: media.id,
        imageUrl: media.src,
        alt: media.alt || logos[key].alt,
      });
      showNotice("success", "Logo enviada com sucesso. Salve para publicar.");
    } catch (error) {
      showNotice("error", messageFromError(error, "Não foi possível enviar a logo."));
    } finally {
      setUploadingKey(null);
    }
  }

  async function handleFeatureIconUpload(id: string, file: File) {
    const isSvg = file.name.toLowerCase().endsWith(".svg");
    const validMime = !file.type || file.type === "image/svg+xml";

    if (!isSvg || !validMime) {
      showNotice("error", "Selecione um arquivo SVG válido.");
      return;
    }

    if (file.size <= 0 || file.size > 2 * 1024 * 1024) {
      showNotice("error", "O SVG deve ter entre 1 byte e 2 MB.");
      return;
    }

    setUploadingKey(`feature:${id}`);

    try {
      const media = await uploadMedia(file);
      updateFeatureItem(id, { iconId: media.id, iconUrl: media.src });
      showNotice("success", "Ícone do benefício enviado. Salve os benefícios para publicar.");
    } catch (error) {
      showNotice("error", messageFromError(error, "Não foi possível enviar o ícone do benefício."));
    } finally {
      setUploadingKey(null);
    }
  }

  async function saveHeroBanners() {
    setIsSavingHero(true);

    try {
      const response = await fetch(HERO_API, {
        body: JSON.stringify({ banners: normalizeHeroOrder(heroBanners) }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "PUT",
      });
      const json = await parseJson<AdminHeroBannersSnapshot & { message?: string }>(response);

      if (!response.ok || !json) {
        throw new Error(json?.message ?? "Não foi possível salvar a Hero Section.");
      }

      setHeroBanners(normalizeHeroOrder(json.banners));
      setHeroIssues(Array.isArray(json.issues) ? json.issues : []);
      showNotice("success", "Hero Section atualizada.");
    } catch (error) {
      showNotice("error", messageFromError(error, "Não foi possível salvar a Hero Section."));
    } finally {
      setIsSavingHero(false);
    }
  }

  async function savePartnerBanner() {
    setIsSavingPartner(true);

    try {
      const response = await fetch(PARTNER_API, {
        body: JSON.stringify({ banner: { ...partnerBanner, isActive: true } }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "PUT",
      });
      const json = await parseJson<AdminPartnerBannerSnapshot & { message?: string }>(response);

      if (!response.ok || !json) {
        throw new Error(json?.message ?? "Não foi possível salvar a imagem do PDV Perfeito.");
      }

      setPartnerBanner({ ...json.banner, isActive: true });
      setPartnerIssues(Array.isArray(json.issues) ? json.issues : []);
      showNotice("success", "Imagem do PDV Perfeito atualizada.");
    } catch (error) {
      showNotice("error", messageFromError(error, "Não foi possível salvar a imagem do PDV Perfeito."));
    } finally {
      setIsSavingPartner(false);
    }
  }

  async function saveSiteImages() {
    setIsSavingSiteImages(true);

    try {
      const response = await fetch(SITE_IMAGES_API, {
        body: JSON.stringify({ images: siteImages }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "PUT",
      });
      const json = await parseJson<AdminSiteImageAssetsSnapshot & { message?: string }>(response);

      if (!response.ok || !json) {
        throw new Error(json?.message ?? "Não foi possível salvar as imagens.");
      }

      setSiteImages(json.images);
      setSiteImageIssues(Array.isArray(json.issues) ? json.issues : []);
      showNotice("success", "Imagens das paginas atualizadas.");
    } catch (error) {
      showNotice("error", messageFromError(error, "Não foi possível salvar as imagens."));
    } finally {
      setIsSavingSiteImages(false);
    }
  }

  async function saveLogos() {
    setIsSavingLogos(true);

    try {
      const response = await fetch(LOGOS_API, {
        body: JSON.stringify({ logos }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "PUT",
      });
      const json = await parseJson<AdminSiteLogosSnapshot & { message?: string }>(response);

      if (!response.ok || !json) {
        throw new Error(json?.message ?? "Não foi possível salvar as logos.");
      }

      setLogos(json.logos);
      setLogoIssues(Array.isArray(json.issues) ? json.issues : []);
      showNotice("success", "Logos do site atualizadas.");
    } catch (error) {
      showNotice("error", messageFromError(error, "Não foi possível salvar as logos."));
    } finally {
      setIsSavingLogos(false);
    }
  }

  async function savePromoMarquee() {
    if (isSavingPromoMarquee) {
      return;
    }

    const validation = getPromoMarqueeValidation(promoMarquee);

    if (!validation.isValid) {
      showNotice("error", validation.message);
      return;
    }

    const previousPersistedPromoMarquee = persistedPromoMarquee;
    setIsSavingPromoMarquee(true);

    try {
      const response = await fetch(PROMO_MARQUEE_API, {
        body: JSON.stringify({ messages: normalizePromoMarqueeOrder(promoMarquee) }),
        headers: {
          "Content-Type": "application/json",
        },
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
      showNotice("success", "Faixa de avisos atualizada.");
    } catch (error) {
      setPromoMarquee(previousPersistedPromoMarquee);
      showNotice("error", messageFromError(error, "Não foi possível salvar a faixa de avisos."));
    } finally {
      setIsSavingPromoMarquee(false);
    }
  }

  async function saveHomeFeatures() {
    if (isSavingFeatures) {
      return;
    }

    const validation = getHomeFeaturesValidation(features);

    if (!validation.isValid) {
      showNotice("error", validation.message);
      return;
    }

    const previousPersistedFeatures = persistedFeatures;
    setIsSavingFeatures(true);

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

      const confirmedItems = json.items.length === FEATURES_BAR_ITEMS.length ? json.items : FEATURES_BAR_ITEMS;
      setFeatures(confirmedItems);
      setPersistedFeatures(confirmedItems);
      setFeatureIssues(Array.isArray(json.issues) ? json.issues : []);
      showNotice("success", "Benefícios comerciais atualizados.");
    } catch (error) {
      setFeatures(previousPersistedFeatures);
      showNotice("error", messageFromError(error, "Não foi possível salvar os benefícios da Home."));
    } finally {
      setIsSavingFeatures(false);
    }
  }

  async function restoreLogo(key: SiteLogoKey) {
    setRestoringLogoKey(key);

    try {
      const response = await fetch(`${LOGOS_API}?key=${encodeURIComponent(key)}`, {
        method: "DELETE",
      });
      const json = await parseJson<AdminSiteLogosSnapshot & { message?: string }>(response);

      if (!response.ok || !json) {
        throw new Error(json?.message ?? "Não foi possível restaurar a logo padrão.");
      }

      setLogos(json.logos);
      setLogoIssues(Array.isArray(json.issues) ? json.issues : []);
      showNotice("success", "Logo padrão restaurada.");
    } catch (error) {
      showNotice("error", messageFromError(error, "Não foi possível restaurar a logo padrão."));
    } finally {
      setRestoringLogoKey(null);
    }
  }

  return (
    <div className="space-y-5">
      <section className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="flex flex-wrap items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-[#1a1a1a]/50">
            <span>Papelito</span>
            <span aria-hidden>·</span>
            <span>Admin</span>
            <span aria-hidden>·</span>
            <span className="text-[#1a1a1a]">Assets</span>
          </p>
          <h2 className="mt-3 text-2xl font-black uppercase tracking-tight text-[#1a1a1a] md:text-[2rem]">
            Assets das páginas
          </h2>
          <p className={`mt-2 max-w-3xl ${MUTED_TEXT_CLASS}`}>
            Configure as logos do site e as imagens públicas usadas na Hero Section, página de
            produtos, página Sobre, PDV Perfeito e página de revendedores. Abra uma seção para
            editar seus assets; nenhuma seção pode ser salva sem imagem.
          </p>
        </div>
      </section>

      {notice ? (
        <div
          className={notice.tone === "success" ? ALERT_SUCCESS_CLASS : ALERT_ERROR_CLASS}
          role="status"
        >
          {notice.tone === "success" ? "✓" : "⚠"} {notice.message}
        </div>
      ) : null}

      <LogosSection
        isRestoring={restoringLogoKey}
        isSaving={isSavingLogos}
        issues={logoIssues}
        logos={logos}
        onAltChange={(key, alt) => updateLogo(key, { alt })}
        onFileSelect={handleLogoUpload}
        onRestore={restoreLogo}
        onSave={saveLogos}
        uploadingKey={uploadingKey}
      />

      <PromoMarqueeSection
        featureItems={features}
        featureIssues={featureIssues}
        richTextContext={richTextContext}
        featureUploadingId={uploadingKey?.startsWith("feature:") ? uploadingKey.slice("feature:".length) : null}
        isSaving={isSavingPromoMarquee}
        isSavingFeatures={isSavingFeatures}
        issues={promoMarqueeIssues}
        messages={promoMarquee}
        onAdd={addPromoMarqueeItem}
        onChange={updatePromoMarqueeItem}
        onFeatureChange={updateFeatureItem}
        onFeatureSave={saveHomeFeatures}
        onFeatureUploadIcon={handleFeatureIconUpload}
        onMove={movePromoMarqueeItem}
        onRemove={removePromoMarqueeItem}
        onSave={savePromoMarquee}
      />

      <CollapsiblePanel
        actions={
          <>
            <button
              className={SECONDARY_BUTTON_CLASS}
              onClick={addHeroBanner}
              type="button"
            >
              <ImagePlus aria-hidden className="h-4 w-4" strokeWidth={2.4} />
              Nova opção
            </button>
            <button
              className={BUTTON_CLASS}
              disabled={isSavingHero}
              onClick={saveHeroBanners}
              type="button"
            >
              {isSavingHero ? (
                <LoaderCircle aria-hidden className="h-4 w-4 animate-spin" />
              ) : (
                <Save aria-hidden className="h-4 w-4" strokeWidth={2.4} />
              )}
              Salvar Hero Section
            </button>
          </>
        }
        description="Aparece no topo da home. Com uma opção vira banner fixo; com mais de uma vira carrossel. Sempre deve existir pelo menos uma opção."
        eyebrow="home"
        hint="Formato ideal: desktop 16:5 e mobile 1:2."
        onOpenChange={setIsHeroPanelOpen}
        open={isHeroPanelOpen}
        title="Hero Section"
      >
        {heroIssues.length > 0 ? <IssuesList issues={heroIssues} /> : null}

        <div className="space-y-4">
          {heroBanners.map((banner, index) => {
            const isOpen = expandedHeroBannerIds.includes(banner.id);
            const regionId = `hero-option-${banner.id}`;

            return (
            <article className={CARD_CLASS} id={`hero-option-card-${banner.id}`} key={banner.id}>
              <header
                className={`flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between ${CARD_HEADER_CLASS}`}
              >
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#231f20]/56">
                    Opção {index + 1}
                  </p>
                  <p className={`mt-1.5 ${MUTED_TEXT_CLASS}`}>
                    Esta imagem aparece na área principal da home. Ordem {banner.order}.
                  </p>
                </div>
                <button
                  aria-controls={regionId}
                  aria-expanded={isOpen}
                  aria-label={isOpen ? `Recolher opção ${index + 1}` : `Expandir opção ${index + 1}`}
                  className={ICON_BUTTON_CLASS}
                  onClick={() =>
                    setExpandedHeroBannerIds((current) =>
                      current.includes(banner.id)
                        ? current.filter((id) => id !== banner.id)
                        : [...current, banner.id],
                    )
                  }
                  type="button"
                >
                  <ChevronDown aria-hidden className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                </button>
              </header>

              <div
                className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out motion-reduce:transition-none ${
                  isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                }`}
              >
                <div
                  aria-label={`Editor da opção ${index + 1}`}
                  className="overflow-hidden"
                  id={regionId}
                  inert={!isOpen}
                  role="region"
                >
                <div className="p-4">
                <div className="flex flex-wrap gap-2">
                  <button
                    className={COMPACT_BUTTON_CLASS}
                    disabled={index === 0}
                    onClick={() => moveHeroBanner(banner.id, -1)}
                    type="button"
                  >
                    <ArrowUp aria-hidden className="h-3.5 w-3.5" strokeWidth={2.4} />
                    Subir
                  </button>
                  <button
                    className={COMPACT_BUTTON_CLASS}
                    disabled={index === heroBanners.length - 1}
                    onClick={() => moveHeroBanner(banner.id, 1)}
                    type="button"
                  >
                    <ArrowDown aria-hidden className="h-3.5 w-3.5" strokeWidth={2.4} />
                    Descer
                  </button>
                  <button
                    className={DESTRUCTIVE_BUTTON_CLASS}
                    disabled={heroBanners.length <= 1}
                    onClick={() => removeHeroBanner(banner.id)}
                    type="button"
                  >
                    <Trash2 aria-hidden className="h-3.5 w-3.5" strokeWidth={2.4} />
                    Remover
                  </button>
                </div>

              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <UploadCard
                  formatHint="Desktop: banner largo 16:5."
                  imageUrl={banner.desktopImageUrl}
                  isUploading={uploadingKey === `hero:${banner.id}:desktop`}
                  label="Imagem desktop"
                  onFileSelect={(file) => handleHeroUpload(banner.id, "desktop", file)}
                />
                <UploadCard
                  formatHint="Mobile: arte vertical 1:2."
                  imageUrl={banner.mobileImageUrl}
                  isUploading={uploadingKey === `hero:${banner.id}:mobile`}
                  label="Imagem mobile"
                  onFileSelect={(file) => handleHeroUpload(banner.id, "mobile", file)}
                  previewClass="object-contain object-top"
                />
              </div>

                <div className="mt-4">
                <div>
                  <label className={LABEL_CLASS} htmlFor={`hero-alt-${banner.id}`}>
                    Texto alternativo
                  </label>
                  <input
                    className={INPUT_CLASS}
                    id={`hero-alt-${banner.id}`}
                    onChange={(event) => updateHeroBanner(banner.id, { alt: event.target.value })}
                    placeholder="Ex: Banner de piteiras Papelito"
                    type="text"
                    value={banner.alt}
                  />
                </div>
              </div>
                </div>
              </div>
              </div>
            </article>
            );
          })}
        </div>
      </CollapsiblePanel>

      <CollapsiblePanel
        actions={
          <button
            className={BUTTON_CLASS}
            disabled={isSavingPartner}
            onClick={savePartnerBanner}
            type="button"
          >
            {isSavingPartner ? (
              <LoaderCircle aria-hidden className="h-4 w-4 animate-spin" />
            ) : (
              <Save aria-hidden className="h-4 w-4" strokeWidth={2.4} />
            )}
            Salvar PDV Perfeito
          </button>
        }
        description="Imagem lateral do bloco PDV Perfeito na home, ao lado do convite para virar parceiro. Enquanto nenhuma imagem for enviada, a home exibe a imagem padrão."
        eyebrow="home"
        title="Imagem do PDV Perfeito"
      >
        {partnerIssues.length > 0 ? <IssuesList issues={partnerIssues} /> : null}

        <article className={CARD_CLASS}>
          <header className={`flex items-center justify-between gap-3 ${CARD_HEADER_CLASS}`}>
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#231f20]/56">
                Bloco parceiro
              </p>
              <p className="mt-1.5 truncate text-sm font-black uppercase tracking-tight text-[#1a1a1a]">
                {partnerBanner.tag || "Sem texto pequeno"}
              </p>
            </div>
            <button
              aria-controls="partner-banner-editor"
              aria-expanded={isPartnerEditorOpen}
              aria-label={isPartnerEditorOpen ? "Recolher bloco parceiro" : "Expandir bloco parceiro"}
              className={ICON_BUTTON_CLASS}
              onClick={() => setIsPartnerEditorOpen((current) => !current)}
              type="button"
            >
              <ChevronDown aria-hidden className={`h-4 w-4 transition-transform ${isPartnerEditorOpen ? "rotate-180" : ""}`} />
            </button>
          </header>

          <div
            className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out motion-reduce:transition-none ${
              isPartnerEditorOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
            }`}
          >
            <div
              aria-label="Editor da Imagem do PDV Perfeito"
              className="overflow-hidden"
              id="partner-banner-editor"
              inert={!isPartnerEditorOpen}
              role="region"
            >
              <div className="p-4">
        <div className="grid gap-4 lg:grid-cols-2">
          <UploadCard
            formatHint="Desktop: foto horizontal, aproximadamente 5:3."
            imageUrl={partnerBanner.desktopImageUrl}
            isUploading={uploadingKey === "partner:desktop"}
            label="Imagem desktop"
            onFileSelect={(file) => handlePartnerUpload("desktop", file)}
          />
          <UploadCard
            formatHint="Mobile: foto vertical 2:3."
            imageUrl={partnerBanner.mobileImageUrl}
            isUploading={uploadingKey === "partner:mobile"}
            label="Imagem mobile"
            onFileSelect={(file) => handlePartnerUpload("mobile", file)}
          />
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div>
            <label className={LABEL_CLASS} htmlFor="partner-alt">
              Texto alternativo
            </label>
            <input
              className={INPUT_CLASS}
              id="partner-alt"
              onChange={(event) => setPartnerBanner((current) => ({ ...current, alt: event.target.value }))}
              placeholder="Parceiros no espaco PDV Perfeito"
              type="text"
              value={partnerBanner.alt}
            />
          </div>
          <div>
            <label className={LABEL_CLASS} htmlFor="partner-href">
              Link interno do botão
            </label>
            <input
              className={INPUT_CLASS}
              id="partner-href"
              onChange={(event) => setPartnerBanner((current) => ({ ...current, href: event.target.value }))}
              placeholder="/revendedor"
              type="text"
              value={partnerBanner.href}
            />
          </div>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div>
            <label className={LABEL_CLASS} htmlFor="partner-tag">
              Texto pequeno
            </label>
            <input
              className={INPUT_CLASS}
              id="partner-tag"
              onChange={(event) => setPartnerBanner((current) => ({ ...current, tag: event.target.value }))}
              placeholder="Seja um parceiro"
              type="text"
              value={partnerBanner.tag}
            />
          </div>
          <div>
            <label className={LABEL_CLASS} htmlFor="partner-cta">
              Texto do botão
            </label>
            <input
              className={INPUT_CLASS}
              id="partner-cta"
              onChange={(event) =>
                setPartnerBanner((current) => ({ ...current, ctaLabel: event.target.value }))
              }
              placeholder="Quero ser um parceiro"
              type="text"
              value={partnerBanner.ctaLabel}
            />
          </div>
        </div>

        <div className="mt-4">
          <label className={LABEL_CLASS} htmlFor="partner-description">
            Descrição
          </label>
          <textarea
            className={TEXTAREA_CLASS}
            id="partner-description"
            onChange={(event) =>
              setPartnerBanner((current) => ({
                ...current,
                description: event.target.value,
              }))
            }
            placeholder="Copy principal do bloco PDV Perfeito."
            value={partnerBanner.description}
          />
        </div>

        <CatalogPdfManager />
              </div>
            </div>
          </div>
        </article>
      </CollapsiblePanel>

      <CollapsiblePanel
        actions={
          <button
            className={BUTTON_CLASS}
            disabled={isSavingSiteImages}
            onClick={saveSiteImages}
            type="button"
          >
            {isSavingSiteImages ? (
              <LoaderCircle aria-hidden className="h-4 w-4 animate-spin" />
            ) : (
              <Save aria-hidden className="h-4 w-4" strokeWidth={2.4} />
            )}
            Salvar imagens
          </button>
        }
        description="Cada imagem abaixo corresponde a uma seção pública específica. Todas já iniciam com o asset atual do site e não podem ser salvas vazias."
        eyebrow="produtos / sobre / revendedor"
        title="Imagens das paginas"
      >
        {siteImageIssues.length > 0 ? <IssuesList issues={siteImageIssues} /> : null}

        <div className="grid gap-4 xl:grid-cols-2">
          {SITE_IMAGE_FIELDS.map((field) => (
            <ImageAssetCard
              asset={siteImages[field.key]}
              config={field}
              isUploading={uploadingKey === `site:${field.key}`}
              key={field.key}
              onAltChange={(alt) => updateSiteImage(field.key, { alt })}
              onFileSelect={(file) => handleSiteImageUpload(field.key, file)}
            />
          ))}
        </div>
      </CollapsiblePanel>
    </div>
  );
}
