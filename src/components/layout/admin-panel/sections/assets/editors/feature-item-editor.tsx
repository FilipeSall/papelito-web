"use client";

import Image from "next/image";

import {
  documentToPlainText,
  resolveRichTextSource,
  type RichTextResolutionContext,
} from "@/features/rich-text";
import type { HomeFeatureItem } from "@/types/home-assets";

import { HARD_BOX_CLASS } from "../assets-classes";
import { INPUT_CLASS, LABEL_CLASS } from "../field-classes";
import { RichTextEditor } from "../rich-text/rich-text-editor";
import { UploadButton } from "../upload-button";

export function FeatureItemEditor({
  index,
  isSaving,
  item,
  onChange,
  onUploadIcon,
  richTextContext,
  uploadingId,
}: {
  index: number;
  isSaving: boolean;
  item: HomeFeatureItem;
  onChange: (patch: Partial<HomeFeatureItem>) => void;
  onUploadIcon: (file: File) => void | Promise<void>;
  richTextContext: RichTextResolutionContext;
  uploadingId: string | null;
}) {
  return (
    <div className="space-y-4">
      <div>
        <label className={LABEL_CLASS} htmlFor={`home-feature-title-${item.id}`}>
          Título *
        </label>
        <input
          className={INPUT_CLASS}
          disabled={isSaving}
          id={`home-feature-title-${item.id}`}
          maxLength={32}
          onChange={(event) => onChange({ title: event.target.value })}
          type="text"
          value={item.title}
        />
        <p className="mt-1 text-right text-[10px] font-black uppercase tracking-[0.12em] text-[#231f20]/48">
          {item.title.length}/32
        </p>
      </div>

      <div>
        <label className={LABEL_CLASS} htmlFor={`home-feature-subtitle-${item.id}`}>
          Texto auxiliar *
        </label>
        <RichTextEditor
          ariaLabel={`Texto auxiliar do benefício ${index + 1}`}
          context={richTextContext}
          disabled={isSaving}
          id={`home-feature-subtitle-${item.id}`}
          maxLength={44}
          onChange={(content) =>
            onChange({ subtitleContent: content, subtitle: documentToPlainText(content) })
          }
          promotionProducts={richTextContext.promotionProducts}
          value={resolveRichTextSource(item.subtitleContent, item.subtitle)}
        />
      </div>

      <div className={HARD_BOX_CLASS}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center border-2 border-[#1a1a1a] bg-brand-yellow">
              <Image alt="" aria-hidden height={18} src={item.iconUrl} unoptimized width={18} />
            </div>
            <div className="min-w-0">
              <p className={LABEL_CLASS}>Ícone SVG *</p>
              <p className="truncate text-xs text-[#231f20]/56">{item.iconUrl}</p>
            </div>
          </div>
          <UploadButton
            accept="image/svg+xml,.svg"
            disabled={isSaving}
            inputLabel={`Enviar ícone do benefício ${index + 1}`}
            isUploading={uploadingId === item.id}
            label="Trocar SVG"
            onFileSelect={onUploadIcon}
          />
        </div>
      </div>
    </div>
  );
}
