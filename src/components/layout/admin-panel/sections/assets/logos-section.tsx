"use client";

import { LoaderCircle, RotateCcw, Save } from "lucide-react";

import { CollapsiblePanel } from "@/components/layout/admin-panel/primitives";
import { SITE_LOGO_DEFAULTS, isDefaultLogo } from "@/lib/site-logos";
import type { ManagedImageAsset, SiteLogoKey, SiteLogos } from "@/types/home-assets";

import {
  BUTTON_CLASS,
  HINT_CLASS,
  INPUT_CLASS,
  LABEL_CLASS,
  MUTED_TEXT_CLASS,
  SECONDARY_BUTTON_CLASS,
  SUBPANEL_CLASS,
} from "./field-classes";
import { IssuesList } from "./issues-list";
import { PreviewImage } from "./preview-image";
import { UploadButton } from "./upload-button";

const LOGO_ACCEPT = "image/svg+xml,image/png,image/webp";

type LogoFieldConfig = {
  key: SiteLogoKey;
  title: string;
  description: string;
  formatHint: string;
};

export const SITE_LOGO_FIELDS: LogoFieldConfig[] = [
  {
    key: "publicHeader",
    title: "Logo das rotas públicas",
    description:
      "Cabeçalho da home, produtos, sobre e demais páginas abertas, no mobile e no desktop.",
    formatHint: "Formato ideal: horizontal com fundo transparente, SVG ou PNG.",
  },
  {
    key: "privateHeader",
    title: "Logo das rotas privadas",
    description:
      "Cabeçalho das áreas autenticadas: perfil, painel administrativo e painel do vendor.",
    formatHint: "Formato ideal: horizontal com fundo transparente, SVG ou PNG.",
  },
  {
    key: "footer",
    title: "Logo do rodapé",
    description: "Rodapé exibido nas rotas públicas e nas rotas autenticadas.",
    formatHint: "Formato ideal: assinatura horizontal clara, aproximadamente 6:1.",
  },
];

export function LogosSection({
  isRestoring,
  isSaving,
  issues,
  logos,
  onAltChange,
  onFileSelect,
  onRestore,
  onSave,
  uploadingKey,
}: {
  isRestoring: SiteLogoKey | null;
  isSaving: boolean;
  issues: string[];
  logos: SiteLogos;
  onAltChange: (key: SiteLogoKey, alt: string) => void;
  onFileSelect: (key: SiteLogoKey, file: File) => void | Promise<void>;
  onRestore: (key: SiteLogoKey) => void | Promise<void>;
  onSave: () => void | Promise<void>;
  uploadingKey: string | null;
}) {
  return (
    <CollapsiblePanel
      actions={
        <button className={BUTTON_CLASS} disabled={isSaving} onClick={() => void onSave()} type="button">
          {isSaving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Salvar logos
        </button>
      }
      description="Cada logo abaixo é usada em uma área específica do site. Enquanto nenhuma imagem for enviada, a área exibe a logo padrão do projeto."
      eyebrow="global"
      hint="Aceita SVG, PNG ou WebP com fundo transparente."
      title="Logos do site"
    >
      {issues.length > 0 ? <IssuesList issues={issues} /> : null}

      <div className="grid gap-4 xl:grid-cols-2">
        {SITE_LOGO_FIELDS.map((field) => (
          <LogoCard
            config={field}
            isRestoring={isRestoring === field.key}
            key={field.key}
            logo={logos[field.key]}
            onAltChange={(alt) => onAltChange(field.key, alt)}
            onFileSelect={(file) => onFileSelect(field.key, file)}
            onRestore={() => void onRestore(field.key)}
            uploadingKey={uploadingKey}
          />
        ))}
      </div>
    </CollapsiblePanel>
  );
}

function LogoCard({
  config,
  isRestoring,
  logo,
  onAltChange,
  onFileSelect,
  onRestore,
  uploadingKey,
}: {
  config: LogoFieldConfig;
  isRestoring: boolean;
  logo: ManagedImageAsset;
  onAltChange: (alt: string) => void;
  onFileSelect: (file: File) => void | Promise<void>;
  onRestore: () => void;
  uploadingKey: string | null;
}) {
  const isDefault = isDefaultLogo(config.key, logo);

  return (
    <div className={SUBPANEL_CLASS}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h4 className="text-base font-black uppercase tracking-tight text-[#1a1a1a]">
            {config.title}
          </h4>
          <p className={`mt-1 ${MUTED_TEXT_CLASS}`}>{config.description}</p>
          <p className={`mt-2 ${HINT_CLASS}`}>{config.formatHint}</p>
          <p className="mt-2 inline-flex items-center gap-2 border-2 border-[#1a1a1a]/20 bg-[#faf8f2] px-2 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-[#231f20]/70">
            <span
              aria-hidden
              className={`inline-block h-2 w-2 rotate-45 ${isDefault ? "bg-[#231f20]/30" : "bg-brand-yellow"}`}
            />
            {isDefault ? "Usando a logo padrão do projeto." : "Usando uma logo personalizada."}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-start justify-end gap-2">
          <UploadButton
            accept={LOGO_ACCEPT}
            inputLabel={`Enviar ${config.title}`}
            isUploading={uploadingKey === `logo:${config.key}`}
            onFileSelect={onFileSelect}
          />
          <button
            className={SECONDARY_BUTTON_CLASS}
            disabled={isDefault || isRestoring}
            onClick={onRestore}
            type="button"
          >
            {isRestoring ? (
              <LoaderCircle className="h-4 w-4 animate-spin" />
            ) : (
              <RotateCcw className="h-4 w-4" />
            )}
            Restaurar padrão
          </button>
        </div>
      </div>

      <PreviewImage
        className="object-contain p-6"
        frameClass="bg-brand-dark"
        imageUrl={logo.imageUrl}
        label={config.title}
        tone="dark"
      />

      <div className="mt-4">
        <label className={LABEL_CLASS} htmlFor={`site-logo-alt-${config.key}`}>
          Texto alternativo
        </label>
        <input
          className={INPUT_CLASS}
          id={`site-logo-alt-${config.key}`}
          onChange={(event) => onAltChange(event.target.value)}
          placeholder={SITE_LOGO_DEFAULTS[config.key].alt}
          type="text"
          value={logo.alt}
        />
      </div>
    </div>
  );
}
