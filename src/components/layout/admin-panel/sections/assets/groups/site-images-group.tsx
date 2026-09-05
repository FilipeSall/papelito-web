"use client";

import { LoaderCircle, Save } from "lucide-react";
import { useState } from "react";

import { ResultFrame } from "@/components/layout/admin-panel/primitives";
import type { SiteImageAssetKey, SiteImageAssets } from "@/types/home-assets";

import { AssetEditorModal } from "../asset-editor-modal";
import { AssetNotice, AssetWarning, type AssetNoticeState } from "../asset-notice";
import { AssetRow, AssetThumb } from "../asset-row";
import { COMPACT_PRIMARY_CLASS } from "../assets-classes";
import type { SiteImageFieldConfig } from "../assets-fields";
import { isSameAsset } from "../assets-dirty";
import { attentionSuffix, countAttention, imageAssetStatus } from "../assets-status";
import { ImageFieldEditor } from "../editors/image-field-editor";

/**
 * As seis imagens de página compartilham um `PUT` só, então o botão libera quando qualquer uma
 * mudou — é isso que a requisição faz. Quem mudou aparece linha a linha, com o selo `Não salvo`.
 */
export function SiteImagesGroup({
  eyebrow,
  fields,
  images,
  isSaving,
  issues,
  notice,
  onAltChange,
  onFileSelect,
  onSave,
  persistedImages,
  uploadingKey,
}: {
  eyebrow: string;
  fields: SiteImageFieldConfig[];
  images: SiteImageAssets;
  isSaving: boolean;
  issues: string[];
  notice: AssetNoticeState | null;
  onAltChange: (key: SiteImageAssetKey, alt: string) => void;
  onFileSelect: (key: SiteImageAssetKey, file: File) => void | Promise<void>;
  onSave: () => Promise<boolean>;
  persistedImages: SiteImageAssets;
  uploadingKey: string | null;
}) {
  const [editingKey, setEditingKey] = useState<SiteImageAssetKey | null>(null);
  const statuses = fields.map((field) => imageAssetStatus(images[field.key], field.key));
  const attention = countAttention(statuses);
  const isDirty = !isSameAsset(images, persistedImages);
  const editingField = fields.find((field) => field.key === editingKey) ?? null;
  const editingImage = editingKey ? images[editingKey] : null;

  async function handleSave() {
    const saved = await onSave();
    if (saved) {
      setEditingKey(null);
    }
  }

  const frameNotice =
    issues.length > 0 || (notice && !editingKey) ? (
      <div className="space-y-3">
        {issues.length > 0 ? <AssetWarning>{issues.join(" ")}</AssetWarning> : null}
        {notice && !editingKey ? <AssetNotice notice={notice} /> : null}
      </div>
    ) : null;

  return (
    <>
      <ResultFrame
        action={
          <button
            className={COMPACT_PRIMARY_CLASS}
            disabled={isSaving || !isDirty}
            onClick={() => void handleSave()}
            type="button"
          >
            {isSaving ? (
              <LoaderCircle aria-hidden className="h-4 w-4 animate-spin" />
            ) : (
              <Save aria-hidden className="h-4 w-4" strokeWidth={2.4} />
            )}
            Salvar imagens do site
          </button>
        }
        notice={frameNotice}
        summary={`Imagens da página · ${fields.length} asset${fields.length === 1 ? "" : "s"}${attentionSuffix(attention)}`}
      >
        {fields.map((field, index) => (
          <AssetRow
            isUnsaved={!isSameAsset(images[field.key], persistedImages[field.key])}
            key={field.key}
            onOpen={() => setEditingKey(field.key)}
            status={statuses[index]}
            thumbnail={<AssetThumb imageUrl={images[field.key]?.imageUrl ?? ""} label={field.title} />}
            title={field.title}
            where={field.where}
          />
        ))}
      </ResultFrame>

      {editingField && editingImage ? (
        <AssetEditorModal
          description={editingField.description}
          eyebrow={eyebrow}
          isSaving={isSaving}
          notice={notice}
          onClose={() => setEditingKey(null)}
          onSave={() => void handleSave()}
          open
          saveLabel="Salvar imagens do site"
          title={editingField.title}
        >
          <ImageFieldEditor
            alt={editingImage.alt}
            description={editingField.description}
            fieldId={`site-image-alt-${editingField.key}`}
            formatHint={editingField.formatHint}
            imageUrl={editingImage.imageUrl}
            isUploading={uploadingKey === `site:${editingField.key}`}
            label={editingField.title}
            onAltChange={(alt) => onAltChange(editingField.key, alt)}
            onFileSelect={(file) => onFileSelect(editingField.key, file)}
            previewClass={editingField.previewClass}
            uploadLabel={`Enviar ${editingField.title}`}
          />
        </AssetEditorModal>
      ) : null}
    </>
  );
}
