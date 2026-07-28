"use client";

import { ArrowDown, ArrowUp, ImagePlus, LoaderCircle, Save, Trash2 } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

import { Panel } from "@/components/layout/admin-panel/primitives";
import { messageFromError } from "@/utils/error-message";
import type {
  AdminHeroBannersSnapshot,
  AdminPartnerBannerSnapshot,
  AdminSiteImageAssetsSnapshot,
  HeroBanner,
  ManagedImageAsset,
  SiteImageAssetKey,
} from "@/types/home-assets";

const HERO_API = "/api/admin/assets/hero-banners";
const PARTNER_API = "/api/admin/assets/partner-banner";
const SITE_IMAGES_API = "/api/admin/assets/site-images";
const MEDIA_API = "/api/admin/assets/media";

const INPUT_CLASS =
  "h-11 w-full rounded-xl border border-[#cec7aa] bg-[#fff9ea] px-4 text-sm leading-5 text-[#1e1c10] outline-none transition focus:border-[#6a5f00] focus:ring-1 focus:ring-[#6a5f00] disabled:cursor-not-allowed disabled:opacity-60";
const TEXTAREA_CLASS =
  "min-h-24 w-full rounded-xl border border-[#cec7aa] bg-[#fff9ea] px-4 py-3 text-sm leading-6 text-[#1e1c10] outline-none transition focus:border-[#6a5f00] focus:ring-1 focus:ring-[#6a5f00] disabled:cursor-not-allowed disabled:opacity-60";
const LABEL_CLASS =
  "mb-1 block text-[12px] font-semibold uppercase leading-4 tracking-[0.05em] text-[#1e1c10]";
const BUTTON_CLASS =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-[#231f20] bg-[#231f20] px-4 py-2 text-sm font-semibold text-[#fff9ea] transition hover:bg-[#3a3536] disabled:cursor-not-allowed disabled:opacity-60";
const SECONDARY_BUTTON_CLASS =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-[#231f20]/16 bg-white px-3 py-2 text-sm font-semibold text-[#231f20] transition hover:bg-[#f6f1e7] disabled:cursor-not-allowed disabled:opacity-60";

type AssetsManagerProps = {
  initialHeroSnapshot: AdminHeroBannersSnapshot;
  initialPartnerSnapshot: AdminPartnerBannerSnapshot;
  initialSiteImagesSnapshot: AdminSiteImageAssetsSnapshot;
};

type NoticeTone = "error" | "success";

type NoticeState = {
  message: string;
  tone: NoticeTone;
};

type UploadResponse = {
  media?: {
    alt?: string;
    id?: number;
    src?: string;
  };
  message?: string;
};

type ImageFieldConfig = {
  key: SiteImageAssetKey;
  title: string;
  eyebrow: string;
  description: string;
  formatHint: string;
  previewClass?: string;
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

async function parseJson<T>(response: Response): Promise<T | null> {
  return (await response.json().catch(() => null)) as T | null;
}

async function uploadMedia(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(MEDIA_API, {
    body: formData,
    method: "POST",
  });
  const json = await parseJson<UploadResponse>(response);

  if (!response.ok || !json?.media) {
    throw new Error(json?.message ?? "Não foi possível enviar a imagem.");
  }

  return {
    alt: typeof json.media.alt === "string" ? json.media.alt : "",
    id: typeof json.media.id === "number" ? json.media.id : 0,
    src: typeof json.media.src === "string" ? json.media.src : "",
  };
}

export function AssetsManager({
  initialHeroSnapshot,
  initialPartnerSnapshot,
  initialSiteImagesSnapshot,
}: AssetsManagerProps) {
  const [heroBanners, setHeroBanners] = useState(() =>
    normalizeHeroOrder(
      initialHeroSnapshot.banners.length > 0 ? initialHeroSnapshot.banners : [createEmptyHeroBanner(0)],
    ),
  );
  const [heroIssues, setHeroIssues] = useState(initialHeroSnapshot.issues);
  const [partnerBanner, setPartnerBanner] = useState(() => ({
    ...initialPartnerSnapshot.banner,
    isActive: true,
  }));
  const [partnerIssues, setPartnerIssues] = useState(initialPartnerSnapshot.issues);
  const [siteImages, setSiteImages] = useState(initialSiteImagesSnapshot.images);
  const [siteImageIssues, setSiteImageIssues] = useState(initialSiteImagesSnapshot.issues);
  const [notice, setNotice] = useState<NoticeState | null>(null);
  const [isSavingHero, setIsSavingHero] = useState(false);
  const [isSavingPartner, setIsSavingPartner] = useState(false);
  const [isSavingSiteImages, setIsSavingSiteImages] = useState(false);
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

  return (
    <div className="space-y-5">
      <section className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-sm text-[#6f6758]">
            <span>Papelito</span>
            <span aria-hidden className="text-[#b2aa98]">/</span>
            <span>Admin</span>
            <span aria-hidden className="text-[#b2aa98]">/</span>
            <span className="font-semibold text-[#231f20]">Assets</span>
          </div>
          <h2
            className="mt-3 text-[2.35rem] font-semibold leading-none tracking-[-0.04em] text-[#231f20]"
            style={{ fontFamily: "var(--font-admin-display)" }}
          >
            Assets das paginas
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#5e574c]">
            Configure as imagens públicas usadas na Hero Section, página de produtos, página Sobre,
            PDV Perfeito e página de revendedores. Nenhuma seção pode ser salva sem imagem.
          </p>
        </div>
      </section>

      {notice ? (
        <div
          className={
            notice.tone === "success"
              ? "rounded-[18px] border border-[#b7c77d] bg-[#f4f8e2] px-4 py-4 text-sm leading-6 text-[#24300c]"
              : "rounded-[18px] border border-[#d59d9d] bg-[#fff1f1] px-4 py-4 text-sm leading-6 text-[#5c1f1f]"
          }
        >
          {notice.message}
        </div>
      ) : null}

      <Panel className="p-5">
        <div className="flex flex-col gap-4 border-b border-[#231f20]/10 pb-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#231f20]/48">
              home
            </p>
            <h3 className="mt-2 text-xl font-semibold text-[#231f20]">Hero Section</h3>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-[#5e574c]">
              Aparece no topo da home. Com uma opção vira banner fixo; com mais de uma vira
              carrossel. Sempre deve existir pelo menos uma opção.
            </p>
            <p className="mt-2 text-xs font-semibold uppercase tracking-[0.08em] text-[#6a5f00]">
              Formato ideal: desktop 16:5 e mobile 1:2.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              className={SECONDARY_BUTTON_CLASS}
              onClick={() => setHeroBanners((current) => [...current, createEmptyHeroBanner(current.length)])}
              type="button"
            >
              <ImagePlus className="h-4 w-4" />
              Nova opção
            </button>
            <button
              className={BUTTON_CLASS}
              disabled={isSavingHero}
              onClick={saveHeroBanners}
              type="button"
            >
              {isSavingHero ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Salvar Hero Section
            </button>
          </div>
        </div>

        {heroIssues.length > 0 ? <IssuesList issues={heroIssues} /> : null}

        <div className="mt-4 space-y-4">
          {heroBanners.map((banner, index) => (
            <div
              className="rounded-2xl border border-[#231f20]/12 bg-white p-4 shadow-[0_10px_24px_rgba(35,31,32,0.04)]"
              key={banner.id}
            >
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6a5f00]">
                    Opção {index + 1}
                  </p>
                  <p className="mt-1 text-sm text-[#5e574c]">
                    Esta imagem aparece na área principal da home. Ordem {banner.order}.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    className={SECONDARY_BUTTON_CLASS}
                    disabled={index === 0}
                    onClick={() => moveHeroBanner(banner.id, -1)}
                    type="button"
                  >
                    <ArrowUp className="h-4 w-4" />
                    Subir
                  </button>
                  <button
                    className={SECONDARY_BUTTON_CLASS}
                    disabled={index === heroBanners.length - 1}
                    onClick={() => moveHeroBanner(banner.id, 1)}
                    type="button"
                  >
                    <ArrowDown className="h-4 w-4" />
                    Descer
                  </button>
                  <button
                    className={SECONDARY_BUTTON_CLASS}
                    disabled={heroBanners.length <= 1}
                    onClick={() => removeHeroBanner(banner.id)}
                    type="button"
                  >
                    <Trash2 className="h-4 w-4" />
                    Remover
                  </button>
                </div>
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
          ))}
        </div>
      </Panel>

      <Panel className="p-5">
        <div className="flex flex-col gap-4 border-b border-[#231f20]/10 pb-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#231f20]/48">
              home
            </p>
            <h3 className="mt-2 text-xl font-semibold text-[#231f20]">Imagem do PDV Perfeito</h3>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-[#5e574c]">
              Imagem lateral do bloco PDV Perfeito na home, ao lado do convite para virar
              parceiro. Enquanto nenhuma imagem for enviada, a home exibe a imagem padrão.
            </p>
          </div>
          <button
            className={BUTTON_CLASS}
            disabled={isSavingPartner}
            onClick={savePartnerBanner}
            type="button"
          >
            {isSavingPartner ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Salvar PDV Perfeito
          </button>
        </div>

        {partnerIssues.length > 0 ? <IssuesList issues={partnerIssues} /> : null}

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
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
      </Panel>

      <Panel className="p-5">
        <div className="flex flex-col gap-4 border-b border-[#231f20]/10 pb-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#231f20]/48">
              produtos / sobre / revendedor
            </p>
            <h3 className="mt-2 text-xl font-semibold text-[#231f20]">Imagens das paginas</h3>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-[#5e574c]">
              Cada imagem abaixo corresponde a uma seção pública específica. Todas já iniciam com
              o asset atual do site e não podem ser salvas vazias.
            </p>
          </div>
          <button
            className={BUTTON_CLASS}
            disabled={isSavingSiteImages}
            onClick={saveSiteImages}
            type="button"
          >
            {isSavingSiteImages ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Salvar imagens
          </button>
        </div>

        {siteImageIssues.length > 0 ? <IssuesList issues={siteImageIssues} /> : null}

        <div className="mt-4 grid gap-4 xl:grid-cols-2">
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
      </Panel>
    </div>
  );
}

function IssuesList({ issues }: { issues: string[] }) {
  return (
    <div className="mt-4 rounded-[18px] border border-[#cfbf80] bg-[#fff6bf] px-4 py-4 text-sm leading-6 text-[#231f20]">
      {issues.join(" ")}
    </div>
  );
}

function ImageAssetCard({
  asset,
  config,
  isUploading,
  onAltChange,
  onFileSelect,
}: {
  asset: ManagedImageAsset;
  config: ImageFieldConfig;
  isUploading: boolean;
  onAltChange: (alt: string) => void;
  onFileSelect: (file: File) => void | Promise<void>;
}) {
  return (
    <div className="rounded-2xl border border-[#231f20]/12 bg-white p-4 shadow-[0_10px_24px_rgba(35,31,32,0.04)]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6a5f00]">
            {config.eyebrow}
          </p>
          <h4 className="mt-1 text-base font-semibold text-[#231f20]">{config.title}</h4>
          <p className="mt-1 text-sm leading-6 text-[#5e574c]">{config.description}</p>
          <p className="mt-2 text-xs font-semibold uppercase tracking-[0.08em] text-[#6a5f00]">
            {config.formatHint}
          </p>
        </div>
        <UploadButton isUploading={isUploading} onFileSelect={onFileSelect} />
      </div>

      <PreviewImage
        className={config.previewClass}
        imageUrl={asset.imageUrl}
        label={config.title}
      />

      <div className="mt-4">
        <label className={LABEL_CLASS} htmlFor={`site-image-alt-${config.key}`}>
          Texto alternativo
        </label>
        <input
          className={INPUT_CLASS}
          id={`site-image-alt-${config.key}`}
          onChange={(event) => onAltChange(event.target.value)}
          type="text"
          value={asset.alt}
        />
      </div>
    </div>
  );
}

function UploadCard({
  formatHint,
  imageUrl,
  isUploading,
  label,
  onFileSelect,
  previewClass,
}: {
  formatHint: string;
  imageUrl: string;
  isUploading: boolean;
  label: string;
  onFileSelect: (file: File) => void | Promise<void>;
  previewClass?: string;
}) {
  return (
    <div className="rounded-2xl border border-[#231f20]/12 bg-[#fffdf7] p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[#6a5f00]">
            {label}
          </p>
          <p className="mt-1 text-sm text-[#5e574c]">{formatHint}</p>
        </div>
        <UploadButton isUploading={isUploading} onFileSelect={onFileSelect} />
      </div>

      <PreviewImage className={previewClass} imageUrl={imageUrl} label={label} />
    </div>
  );
}

function UploadButton({
  isUploading,
  onFileSelect,
}: {
  isUploading: boolean;
  onFileSelect: (file: File) => void | Promise<void>;
}) {
  return (
    <label className={SECONDARY_BUTTON_CLASS}>
      {isUploading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
      Enviar
      <input
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) {
            void onFileSelect(file);
          }
          event.target.value = "";
        }}
        type="file"
      />
    </label>
  );
}

function PreviewImage({
  className,
  imageUrl,
  label,
}: {
  className?: string;
  imageUrl: string;
  label: string;
}) {
  return (
    <div className="mt-4 overflow-hidden rounded-xl border border-dashed border-[#231f20]/15 bg-white">
      {imageUrl ? (
        <div className="relative h-48 w-full">
          <Image
            alt={label}
            className={className ?? "object-cover"}
            fill
            sizes="(max-width: 1024px) 100vw, 480px"
            src={imageUrl}
          />
        </div>
      ) : (
        <div className="flex h-48 items-center justify-center px-4 text-center text-sm text-[#7b7568]">
          Nenhuma imagem enviada ainda.
        </div>
      )}
    </div>
  );
}
