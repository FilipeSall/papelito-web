"use client";

import Image from "next/image";
import { ChevronDown, LoaderCircle, Save } from "lucide-react";
import { useId, useState } from "react";

import { getHomeFeaturesValidation } from "@/components/layout/features-bar/home-features-validation";
import {
  documentToPlainText,
  resolveRichTextDocument,
  resolveRichTextSource,
  type RichTextResolutionContext,
} from "@/features/rich-text";
import type { HomeFeatureItem } from "@/types/home-assets";

import {
  ALERT_WARNING_CLASS,
  BUTTON_CLASS,
  CARD_CLASS,
  CARD_HEADER_CLASS,
  DIAMOND_CLASS,
  ICON_BUTTON_CLASS,
  INPUT_CLASS,
  LABEL_CLASS,
  MUTED_TEXT_CLASS,
  SUBPANEL_CLASS,
} from "./field-classes";
import { IssuesList } from "./issues-list";
import { RichTextEditor } from "./rich-text/rich-text-editor";
import { UploadButton } from "./upload-button";

type HomeFeaturesSectionProps = {
  richTextContext: RichTextResolutionContext;
  isSaving: boolean;
  issues: string[];
  items: HomeFeatureItem[];
  onChange: (id: string, patch: Partial<HomeFeatureItem>) => void;
  onSave: () => void;
  onUploadIcon: (id: string, file: File) => void | Promise<void>;
  uploadingId: string | null;
};

type HomeFeatureCardProps = {
  index: number;
  isSaving: boolean;
  item: HomeFeatureItem;
  onChange: (id: string, patch: Partial<HomeFeatureItem>) => void;
  onUploadIcon: (id: string, file: File) => void | Promise<void>;
  promotionProducts: RichTextResolutionContext["promotionProducts"];
  richTextContext: RichTextResolutionContext;
  uploadingId: string | null;
};

function HomeFeatureCard({
  index,
  isSaving,
  item,
  onChange,
  onUploadIcon,
  promotionProducts,
  richTextContext,
  uploadingId,
}: Readonly<HomeFeatureCardProps>) {
  const [isOpen, setIsOpen] = useState(false);
  const regionId = useId();

  return (
    <article className={CARD_CLASS}>
      <header className={`flex items-center justify-between gap-3 ${CARD_HEADER_CLASS}`}>
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center border-2 border-[#1a1a1a] bg-brand-yellow">
            <Image alt="" aria-hidden height={16} src={item.iconUrl} unoptimized width={16} />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#231f20]/[.56]">
              Benefício {index + 1}
            </p>
            <p className="mt-1 truncate text-sm font-black uppercase tracking-tight text-[#1a1a1a]">
              {item.title || "Sem título"}
            </p>
          </div>
        </div>
        <button
          aria-controls={regionId}
          aria-expanded={isOpen}
          aria-label={isOpen ? `Recolher benefício ${index + 1}` : `Expandir benefício ${index + 1}`}
          className={ICON_BUTTON_CLASS}
          onClick={() => setIsOpen((current) => !current)}
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
        <section
          aria-label={`Editor do benefício ${index + 1}`}
          className="overflow-hidden"
          id={regionId}
          inert={!isOpen}
        >
          <div className="space-y-3 p-4">
            <div>
              <label className={LABEL_CLASS} htmlFor={`home-feature-title-${item.id}`}>
                Título
              </label>
              <input
                className={INPUT_CLASS}
                disabled={isSaving}
                id={`home-feature-title-${item.id}`}
                maxLength={32}
                onChange={(event) => onChange(item.id, { title: event.target.value })}
                type="text"
                value={item.title}
              />
              <p className="mt-1 text-right text-[10px] font-black uppercase tracking-[0.12em] text-[#231f20]/48">
                {item.title.length}/32
              </p>
            </div>

            <div>
              <label className={LABEL_CLASS} htmlFor={`home-feature-subtitle-${item.id}`}>
                Texto auxiliar
              </label>
              <RichTextEditor
                ariaLabel={`Texto auxiliar do benefício ${index + 1}`}
                context={richTextContext}
                disabled={isSaving}
                id={`home-feature-subtitle-${item.id}`}
                maxLength={44}
                onChange={(content) =>
                  onChange(item.id, {
                    subtitleContent: content,
                    subtitle: documentToPlainText(content),
                  })
                }
                promotionProducts={promotionProducts}
                value={resolveRichTextSource(item.subtitleContent, item.subtitle)}
              />
            </div>

              <div className="flex flex-wrap items-center justify-between gap-3 border-t-2 border-[#231f20]/10 pt-4">
              <div className="min-w-0">
                <p className={LABEL_CLASS}>Ícone SVG</p>
                <p className="truncate text-xs text-[#231f20]/[.56]">{item.iconUrl}</p>
              </div>
              <UploadButton
                accept="image/svg+xml,.svg"
                disabled={isSaving}
                inputLabel={`Enviar ícone do benefício ${index + 1}`}
                isUploading={uploadingId === item.id}
                label="Trocar SVG"
                onFileSelect={(file) => onUploadIcon(item.id, file)}
              />
            </div>
          </div>
        </section>
      </div>
    </article>
  );
}

export function HomeFeaturesSection({
  richTextContext,
  isSaving,
  issues,
  items,
  onChange,
  onSave,
  onUploadIcon,
  uploadingId,
}: Readonly<HomeFeaturesSectionProps>) {
  const validation = getHomeFeaturesValidation(items);
  const previewItems = items.map((item) => {
    const nodes = resolveRichTextDocument(
      resolveRichTextSource(item.subtitleContent, item.subtitle),
      richTextContext,
    );

    return {
      ...item,
      subtitle: nodes === null ? "" : nodes.map((node) => node.text).join(""),
    };
  });

  return (
    <section className="mt-8 border-t-2 border-[#231f20]/10 pt-6" aria-labelledby="home-features-title">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-[#231f20]/[.56]">
            <span aria-hidden className={DIAMOND_CLASS} />
            <span>Home</span>
          </p>
          <h4
            className="mt-2 text-xl font-black uppercase tracking-tight text-[#1a1a1a]"
            id="home-features-title"
          >
            Benefícios comerciais da Home
          </h4>
          <p className={`mt-1 ${MUTED_TEXT_CLASS}`}>
            Edite os quatro benefícios exibidos abaixo do Hero. Os ícones devem ser SVGs seguros.
            O subtítulo aceita negrito, itálico e dados dinâmicos do marketplace.
          </p>
        </div>
        <button
          className={BUTTON_CLASS}
          disabled={isSaving || !validation.isValid}
          onClick={onSave}
          type="button"
        >
          {isSaving ? (
            <LoaderCircle aria-hidden className="h-4 w-4 animate-spin" />
          ) : (
            <Save aria-hidden className="h-4 w-4" strokeWidth={2.4} />
          )}
          Salvar benefícios
        </button>
      </div>

      {!validation.isValid ? (
        <div className={`mt-4 ${ALERT_WARNING_CLASS}`} role="alert">
          ⚠ {validation.message}
        </div>
      ) : null}

      {issues.length > 0 ? <IssuesList issues={issues} /> : null}

      <div className="mt-5 grid gap-3 xl:grid-cols-2">
        {items.map((item, index) => (
          <HomeFeatureCard
            index={index}
            isSaving={isSaving}
            item={item}
            key={item.id}
            onChange={onChange}
            onUploadIcon={onUploadIcon}
            promotionProducts={richTextContext.promotionProducts}
            richTextContext={richTextContext}
            uploadingId={uploadingId}
          />
        ))}
      </div>

      <div className={`mt-5 ${SUBPANEL_CLASS}`}>
        <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-[#231f20]/[.56]">
          <span aria-hidden className={DIAMOND_CLASS} />
          <span>Prévia</span>
        </p>
        <div className="mt-3 grid grid-cols-2 border-t-2 border-brand-yellow md:grid-cols-4">
          {previewItems.map((item, index) => (
            <div
              className={`flex min-h-20 items-center gap-3 px-3 py-3 ${index < previewItems.length - 1 ? "border-r border-[#f3f4f6]" : ""}`}
              key={`${item.id}-preview`}
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-yellow">
                <Image alt="" aria-hidden height={14} src={item.iconUrl} unoptimized width={14} />
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs font-black text-[#231f20]">{item.title}</p>
                <p className="truncate text-[11px] text-text-muted">{item.subtitle}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
