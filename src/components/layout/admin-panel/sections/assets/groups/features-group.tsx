"use client";

import Image from "next/image";
import { LoaderCircle, Save } from "lucide-react";
import { useState } from "react";

import { ResultFrame } from "@/components/layout/admin-panel/primitives";
import { getHomeFeaturesValidation } from "@/components/layout/features-bar/home-features-validation";
import {
  resolveRichTextDocument,
  resolveRichTextSource,
  type RichTextResolutionContext,
} from "@/features/rich-text";
import type { HomeFeatureItem } from "@/types/home-assets";

import { AssetEditorModal } from "../asset-editor-modal";
import { AssetNotice, AssetWarning, type AssetNoticeState } from "../asset-notice";
import { AssetRow, AssetThumb } from "../asset-row";
import { COMPACT_PRIMARY_CLASS, HARD_BOX_CLASS } from "../assets-classes";
import { isSameAsset } from "../assets-dirty";
import { attentionSuffix, countAttention, featureItemStatus } from "../assets-status";
import { FeatureItemEditor } from "../editors/feature-item-editor";

export function FeaturesGroup({
  isSaving,
  issues,
  items,
  notice,
  onChange,
  onSave,
  onUploadIcon,
  persistedItems,
  richTextContext,
  uploadingId,
}: {
  isSaving: boolean;
  issues: string[];
  items: HomeFeatureItem[];
  notice: AssetNoticeState | null;
  onChange: (id: string, patch: Partial<HomeFeatureItem>) => void;
  onSave: () => Promise<boolean>;
  onUploadIcon: (id: string, file: File) => void | Promise<void>;
  persistedItems: HomeFeatureItem[];
  richTextContext: RichTextResolutionContext;
  uploadingId: string | null;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const validation = getHomeFeaturesValidation(items);
  const statuses = items.map(featureItemStatus);
  const attention = countAttention(statuses);
  const isDirty = !isSameAsset(items, persistedItems);
  const editingIndex = items.findIndex((item) => item.id === editingId);
  const editingItem = editingIndex >= 0 ? items[editingIndex] : null;

  const previewItems = items.map((item) => {
    const nodes = resolveRichTextDocument(
      resolveRichTextSource(item.subtitleContent, item.subtitle),
      richTextContext,
    );

    return { ...item, subtitle: nodes === null ? "" : nodes.map((node) => node.text).join("") };
  });

  async function handleSave() {
    const saved = await onSave();
    if (saved) {
      setEditingId(null);
    }
  }

  return (
    <>
      <ResultFrame
        action={
          <button
            className={COMPACT_PRIMARY_CLASS}
            disabled={isSaving || !isDirty || !validation.isValid}
            onClick={() => void handleSave()}
            type="button"
          >
            {isSaving ? (
              <LoaderCircle aria-hidden className="h-4 w-4 animate-spin" />
            ) : (
              <Save aria-hidden className="h-4 w-4" strokeWidth={2.4} />
            )}
            Salvar benefícios
          </button>
        }
        notice={
          <div className="space-y-3">
            {!validation.isValid ? <AssetWarning>{validation.message}</AssetWarning> : null}
            {issues.length > 0 ? <AssetWarning>{issues.join(" ")}</AssetWarning> : null}
            {notice && !editingId ? <AssetNotice notice={notice} /> : null}

            <div className={HARD_BOX_CLASS}>
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#231f20]/56">
                Prévia — a faixa como ela aparece abaixo do Hero
              </p>
              <div className="mt-3 grid grid-cols-2 border-t-2 border-brand-yellow md:grid-cols-4">
                {previewItems.map((item, index) => (
                  <div
                    className={`flex min-h-20 items-center gap-3 px-3 py-3 ${
                      index < previewItems.length - 1 ? "border-r border-[#f3f4f6]" : ""
                    }`}
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
          </div>
        }
        summary={`Benefícios da Home · ${items.length} itens${attentionSuffix(attention)}`}
      >
        {items.map((item, index) => (
          <AssetRow
            isUnsaved={
              !isSameAsset(
                item,
                persistedItems.find((persisted) => persisted.id === item.id),
              )
            }
            key={item.id}
            onOpen={() => setEditingId(item.id)}
            status={statuses[index]}
            thumbnail={
              <AssetThumb
                imageUrl={item.iconUrl}
                label={item.title || `Benefício ${index + 1}`}
                tone="yellow"
              />
            }
            title={item.title || `Benefício ${index + 1} sem título`}
            where={`Benefício ${index + 1} da faixa abaixo do Hero`}
          />
        ))}
      </ResultFrame>

      {editingItem ? (
        <AssetEditorModal
          description="Título curto, texto auxiliar com dados dinâmicos e um ícone SVG. Os quatro benefícios são obrigatórios."
          eyebrow="Painel admin · Assets · Home"
          isSaveDisabled={!validation.isValid}
          isSaving={isSaving}
          notice={notice}
          onClose={() => setEditingId(null)}
          onSave={() => void handleSave()}
          open
          saveLabel="Salvar benefícios"
          title={`Benefício ${editingIndex + 1}`}
        >
          <FeatureItemEditor
            index={editingIndex}
            isSaving={isSaving}
            item={editingItem}
            onChange={(patch) => onChange(editingItem.id, patch)}
            onUploadIcon={(file) => onUploadIcon(editingItem.id, file)}
            richTextContext={richTextContext}
            uploadingId={uploadingId}
          />
        </AssetEditorModal>
      ) : null}
    </>
  );
}
