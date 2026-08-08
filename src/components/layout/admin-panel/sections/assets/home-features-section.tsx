"use client";

import Image from "next/image";
import { LoaderCircle, Save } from "lucide-react";

import { getHomeFeaturesValidation } from "@/components/layout/features-bar/home-features-validation";
import {
  documentToPlainText,
  resolveRichTextDocument,
  resolveRichTextSource,
  type RichTextResolutionContext,
} from "@/features/rich-text";
import type { HomeFeatureItem } from "@/types/home-assets";

import {
  BUTTON_CLASS,
  INPUT_CLASS,
  LABEL_CLASS,
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

export function HomeFeaturesSection({
  richTextContext,
  isSaving,
  issues,
  items,
  onChange,
  onSave,
  onUploadIcon,
  uploadingId,
}: HomeFeaturesSectionProps) {
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
    <section className="mt-8 border-t border-[#231f20]/10 pt-6" aria-labelledby="home-features-title">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6a5f00]">Home</p>
          <h4 className="mt-2 text-xl font-semibold text-[#231f20]" id="home-features-title">
            Benefícios comerciais da Home
          </h4>
          <p className="mt-1 text-sm leading-6 text-[#5e574c]">
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
          {isSaving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Salvar benefícios
        </button>
      </div>

      {!validation.isValid ? (
        <div className="mt-4 rounded-[18px] border border-[#cfbf80] bg-[#fff6bf] px-4 py-4 text-sm leading-6 text-[#231f20]" role="alert">
          {validation.message}
        </div>
      ) : null}

      {issues.length > 0 ? <IssuesList issues={issues} /> : null}

      <div className="mt-5 grid gap-3 xl:grid-cols-2">
        {items.map((item, index) => (
          <article
            className="rounded-2xl border border-[#231f20]/12 bg-white p-4 shadow-[0_8px_18px_rgba(35,31,32,0.03)]"
            key={item.id}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6a5f00]">
                  Benefício {index + 1}
                </p>
                <p className="mt-1 text-xs text-[#6f6758]">Prévia do item exibido na Home</p>
              </div>
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#ffe500]">
                <Image
                  alt=""
                  aria-hidden
                  height={16}
                  src={item.iconUrl}
                  unoptimized
                  width={16}
                />
              </div>
            </div>

            <div className="mt-4 space-y-3">
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
                <p className="mt-1 text-right text-xs text-[#6f6758]">{item.title.length}/32</p>
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
                  promotionProducts={richTextContext.promotionProducts}
                  value={resolveRichTextSource(item.subtitleContent, item.subtitle)}
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#231f20]/10 pt-3">
                <div className="min-w-0">
                  <p className={LABEL_CLASS}>Ícone SVG</p>
                  <p className="truncate text-xs text-[#6f6758]">{item.iconUrl}</p>
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
          </article>
        ))}
      </div>

      <div className="mt-5 rounded-2xl border border-[#231f20]/10 bg-white p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6a5f00]">Prévia</p>
        <div className="mt-3 grid grid-cols-2 border-t border-brand-yellow md:grid-cols-4">
          {previewItems.map((item, index) => (
            <div
              className={`flex min-h-20 items-center gap-3 px-3 py-3 ${index < previewItems.length - 1 ? "border-r border-[#f3f4f6]" : ""}`}
              key={`${item.id}-preview`}
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#ffe500]">
                <Image alt="" aria-hidden height={14} src={item.iconUrl} unoptimized width={14} />
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs font-black text-[#231f20]">{item.title}</p>
                <p className="truncate text-[11px] text-[#99a1af]">{item.subtitle}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
