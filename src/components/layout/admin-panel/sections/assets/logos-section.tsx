"use client";

import { LoaderCircle, RotateCcw, Save } from "lucide-react";

import { CollapsiblePanel } from "@/components/layout/admin-panel/primitives";
import { SITE_LOGO_DEFAULTS, isDefaultLogo } from "@/lib/site-logos";
import type { ManagedImageAsset, SiteLogoKey, SiteLogos } from "@/types/home-assets";

import { BUTTON_CLASS, INPUT_CLASS, LABEL_CLASS, SECONDARY_BUTTON_CLASS } from "./field-classes";
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
    <div className="rounded-2xl border border-[#231f20]/12 bg-white p-4 shadow-[0_10px_24px_rgba(35,31,32,0.04)]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h4 className="text-base font-semibold text-[#231f20]">{config.title}</h4>
          <p className="mt-1 text-sm leading-6 text-[#5e574c]">{config.description}</p>
          <p className="mt-2 text-xs font-semibold uppercase tracking-[0.08em] text-[#6a5f00]">
            {config.formatHint}
          </p>
          <p className="mt-2 text-xs text-[#7b7568]">
            {isDefault ? "Usando a logo padrão do projeto." : "Usando uma logo personalizada."}
          </p>
        </div>
        <div className="flex flex-wrap items-start gap-2">
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
