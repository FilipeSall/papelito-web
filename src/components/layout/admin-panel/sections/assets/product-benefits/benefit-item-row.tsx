"use client";

import Image from "next/image";
import { ArrowDown, ArrowUp, Trash2 } from "lucide-react";
import { useId } from "react";

import {
  documentToPlainText,
  type RichTextDocument,
  type RichTextResolutionContext,
} from "@/features/rich-text";
import type { AdminBenefitItem } from "@/types/product-benefits";

import {
  COMPACT_BUTTON_CLASS,
  DESTRUCTIVE_BUTTON_CLASS,
  ICON_BUTTON_CLASS,
  INPUT_CLASS,
  LABEL_CLASS,
  MUTED_TEXT_CLASS,
  SUBPANEL_CLASS,
} from "../field-classes";
import { RichTextEditor } from "../rich-text/rich-text-editor";
import { UploadButton } from "../upload-button";
import { EmojiField } from "./emoji-field";

export const BENEFIT_TITLE_MAX_LENGTH = 48;
export const BENEFIT_DESCRIPTION_MAX_LENGTH = 96;

export type BenefitItemDraft = AdminBenefitItem & { key: string };

export function BenefitItemRow({
  canMoveDown,
  canMoveUp,
  disabled,
  index,
  item,
  onChange,
  onMove,
  onRemove,
  onUploadIcon,
  richTextContext,
  uploadingKey,
}: Readonly<{
  canMoveDown: boolean;
  canMoveUp: boolean;
  disabled: boolean;
  index: number;
  item: BenefitItemDraft;
  onChange: (key: string, patch: Partial<BenefitItemDraft>) => void;
  onMove: (key: string, direction: -1 | 1) => void;
  onRemove: (key: string) => void;
  onUploadIcon: (key: string, file: File) => void | Promise<void>;
  richTextContext: RichTextResolutionContext;
  uploadingKey: string | null;
}>) {
  const titleId = useId();
  const position = index + 1;

  function handleDescriptionChange(document: RichTextDocument) {
    onChange(item.key, {
      descriptionContent: document.length > 0 ? document : null,
      description: documentToPlainText(document).slice(0, BENEFIT_DESCRIPTION_MAX_LENGTH),
    });
  }

  return (
    <li className={`${SUBPANEL_CLASS} space-y-4`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-[10px] font-black uppercase tracking-[0.18em] text-[#231f20]/56">
          Benefício {position}
        </span>

        <div className="flex items-center gap-2">
          <label className="flex cursor-pointer items-center gap-2 text-[11px] font-black uppercase tracking-[0.12em] text-[#1a1a1a]">
            <input
              checked={item.isActive}
              className="h-4 w-4 accent-[#1a1a1a]"
              disabled={disabled}
              onChange={(event) => onChange(item.key, { isActive: event.target.checked })}
              type="checkbox"
            />
            Ativo
          </label>

          <button
            aria-label={`Subir benefício ${position}`}
            className={ICON_BUTTON_CLASS}
            disabled={disabled || !canMoveUp}
            onClick={() => onMove(item.key, -1)}
            type="button"
          >
            <ArrowUp aria-hidden className="h-4 w-4" />
          </button>
          <button
            aria-label={`Descer benefício ${position}`}
            className={ICON_BUTTON_CLASS}
            disabled={disabled || !canMoveDown}
            onClick={() => onMove(item.key, 1)}
            type="button"
          >
            <ArrowDown aria-hidden className="h-4 w-4" />
          </button>
          <button
            aria-label={`Remover benefício ${position}`}
            className={DESTRUCTIVE_BUTTON_CLASS}
            disabled={disabled}
            onClick={() => onRemove(item.key)}
            type="button"
          >
            <Trash2 aria-hidden className="h-4 w-4" />
            Remover
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-[minmax(0,15rem)_minmax(0,1fr)]">
        <div className="space-y-3">
          <div className="flex gap-2">
            <button
              aria-pressed={item.iconType === "emoji"}
              className={`${COMPACT_BUTTON_CLASS} ${item.iconType === "emoji" ? "border-[#1a1a1a] bg-brand-yellow" : ""}`}
              disabled={disabled}
              onClick={() => onChange(item.key, { iconType: "emoji" })}
              type="button"
            >
              Emoji
            </button>
            <button
              aria-pressed={item.iconType === "svg"}
              className={`${COMPACT_BUTTON_CLASS} ${item.iconType === "svg" ? "border-[#1a1a1a] bg-brand-yellow" : ""}`}
              disabled={disabled}
              onClick={() => onChange(item.key, { iconType: "svg" })}
              type="button"
            >
              SVG
            </button>
          </div>

          {item.iconType === "emoji" ? (
            <EmojiField
              disabled={disabled}
              onChange={(value) => onChange(item.key, { iconEmoji: value })}
              value={item.iconEmoji}
            />
          ) : (
            <div className="space-y-2">
              <span className={LABEL_CLASS}>Ícone SVG</span>
              <div className="flex items-center gap-3">
                {item.iconUrl === "" ? (
                  <span className={MUTED_TEXT_CLASS}>Nenhum</span>
                ) : (
                  <Image alt="" aria-hidden height={24} src={item.iconUrl} width={24} />
                )}
                <UploadButton
                  accept="image/svg+xml,.svg"
                  disabled={disabled}
                  inputLabel={`Enviar ícone do benefício ${position}`}
                  isUploading={uploadingKey === item.key}
                  label="Trocar SVG"
                  onFileSelect={(file) => onUploadIcon(item.key, file)}
                />
              </div>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <div>
            <label className={LABEL_CLASS} htmlFor={titleId}>
              Título
            </label>
            <input
              className={INPUT_CLASS}
              disabled={disabled}
              id={titleId}
              maxLength={BENEFIT_TITLE_MAX_LENGTH}
              onChange={(event) => onChange(item.key, { title: event.target.value })}
              value={item.title}
            />
          </div>

          <div>
            <span className={LABEL_CLASS}>Texto auxiliar</span>
            <RichTextEditor
              ariaLabel={`Texto auxiliar do benefício ${position}`}
              context={richTextContext}
              disabled={disabled}
              id={`benefit-description-${item.key}`}
              maxLength={BENEFIT_DESCRIPTION_MAX_LENGTH}
              onChange={handleDescriptionChange}
              promotionProducts={richTextContext.promotionProducts}
              value={item.descriptionContent ?? []}
            />
          </div>
        </div>
      </div>
    </li>
  );
}
