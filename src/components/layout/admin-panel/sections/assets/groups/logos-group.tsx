"use client";

import { LoaderCircle, RotateCcw, Save } from "lucide-react";
import { useState } from "react";

import { ResultFrame } from "@/components/layout/admin-panel/primitives";
import { SITE_LOGO_DEFAULTS, isDefaultLogo } from "@/lib/site-logos";
import type { ManagedImageAsset, SiteLogoKey, SiteLogos } from "@/types/home-assets";

import { AssetEditorModal } from "../asset-editor-modal";
import { AssetNotice, AssetWarning, type AssetNoticeState } from "../asset-notice";
import { AssetRow, AssetThumb } from "../asset-row";
import { COMPACT_PRIMARY_CLASS, SECONDARY_ACTION_CLASS } from "../assets-classes";
import { LOGO_ACCEPT, SITE_LOGO_FIELDS } from "../assets-fields";
import { isSameAsset } from "../assets-dirty";
import { attentionSuffix, countAttention, logoStatus } from "../assets-status";
import { ImageFieldEditor } from "../editors/image-field-editor";

export function LogosGroup({
  isRestoring,
  isSaving,
  issues,
  logos,
  notice,
  onAltChange,
  onFileSelect,
  onRestore,
  onSave,
  persistedLogos,
  uploadingKey,
}: {
  isRestoring: SiteLogoKey | null;
  isSaving: boolean;
  issues: string[];
  logos: SiteLogos;
  notice: AssetNoticeState | null;
  onAltChange: (key: SiteLogoKey, alt: string) => void;
  onFileSelect: (key: SiteLogoKey, file: File) => void | Promise<void>;
  onRestore: (key: SiteLogoKey) => void | Promise<void>;
  onSave: () => Promise<boolean>;
  persistedLogos: SiteLogos;
  uploadingKey: string | null;
}) {
  const [editingKey, setEditingKey] = useState<SiteLogoKey | null>(null);
  const statuses = SITE_LOGO_FIELDS.map((field) => logoStatus(field.key, logos[field.key]));
  const attention = countAttention(statuses);
  const isDirty = !isSameAsset(logos, persistedLogos);
  const editingField = SITE_LOGO_FIELDS.find((field) => field.key === editingKey) ?? null;
  const editingLogo: ManagedImageAsset | null = editingKey ? logos[editingKey] : null;

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
            Salvar logos
          </button>
        }
        notice={frameNotice}
        summary={`Logos do site · ${SITE_LOGO_FIELDS.length} assets${attentionSuffix(attention)}`}
      >
        {SITE_LOGO_FIELDS.map((field, index) => (
          <AssetRow
            isUnsaved={!isSameAsset(logos[field.key], persistedLogos[field.key])}
            key={field.key}
            onOpen={() => setEditingKey(field.key)}
            status={statuses[index]}
            thumbnail={
              <AssetThumb
                imageUrl={logos[field.key].imageUrl}
                label={field.title}
                tone={
                  field.key === "publicHeader" && isDefaultLogo(field.key, logos[field.key])
                    ? "light"
                    : "dark"
                }
              />
            }
            title={field.title}
            where={field.where}
          />
        ))}
      </ResultFrame>

      {editingField && editingLogo ? (
        <AssetEditorModal
          description={editingField.description}
          eyebrow="Painel admin · Assets · Global"
          extraActions={
            <button
              className={SECONDARY_ACTION_CLASS}
              disabled={isDefaultLogo(editingField.key, editingLogo) || isRestoring !== null}
              onClick={() => void onRestore(editingField.key)}
              type="button"
            >
              {isRestoring === editingField.key ? (
                <LoaderCircle aria-hidden className="h-4 w-4 animate-spin" />
              ) : (
                <RotateCcw aria-hidden className="h-4 w-4" strokeWidth={2.4} />
              )}
              Restaurar padrão
            </button>
          }
          isSaving={isSaving}
          notice={notice}
          onClose={() => setEditingKey(null)}
          onSave={() => void handleSave()}
          open
          saveLabel="Salvar logos"
          title={editingField.title}
        >
          <ImageFieldEditor
            accept={LOGO_ACCEPT}
            alt={editingLogo.alt}
            altPlaceholder={SITE_LOGO_DEFAULTS[editingField.key].alt}
            description={editingField.description}
            fieldId={`site-logo-alt-${editingField.key}`}
            formatHint={editingField.formatHint}
            imageUrl={editingLogo.imageUrl}
            isUploading={uploadingKey === `logo:${editingField.key}`}
            label={editingField.title}
            onAltChange={(alt) => onAltChange(editingField.key, alt)}
            onFileSelect={(file) => onFileSelect(editingField.key, file)}
            previewClass="object-contain p-6"
            previewFrameClass={
              editingField.key === "publicHeader" && isDefaultLogo(editingField.key, editingLogo)
                ? "bg-brand-yellow"
                : "bg-brand-dark"
            }
            previewTone={
              editingField.key === "publicHeader" && isDefaultLogo(editingField.key, editingLogo)
                ? "light"
                : "dark"
            }
            uploadLabel={`Enviar ${editingField.title}`}
          />
        </AssetEditorModal>
      ) : null}
    </>
  );
}
