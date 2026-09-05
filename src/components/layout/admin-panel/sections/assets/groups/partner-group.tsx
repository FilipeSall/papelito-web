"use client";

import { LoaderCircle, Save } from "lucide-react";
import { useState } from "react";

import { ResultFrame } from "@/components/layout/admin-panel/primitives";
import type { PartnerBannerConfig } from "@/types/home-assets";

import { AssetEditorModal } from "../asset-editor-modal";
import { AssetNotice, AssetWarning, type AssetNoticeState } from "../asset-notice";
import { AssetRow, AssetThumb } from "../asset-row";
import { COMPACT_PRIMARY_CLASS } from "../assets-classes";
import { isSameAsset } from "../assets-dirty";
import { attentionSuffix, countAttention, partnerBannerStatus } from "../assets-status";
import { PartnerBannerEditor } from "../editors/partner-banner-editor";

export function PartnerGroup({
  banner,
  isSaving,
  issues,
  notice,
  onChange,
  onFileSelect,
  onSave,
  persistedBanner,
  uploadingKey,
}: {
  banner: PartnerBannerConfig;
  isSaving: boolean;
  issues: string[];
  notice: AssetNoticeState | null;
  onChange: (patch: Partial<PartnerBannerConfig>) => void;
  onFileSelect: (field: "desktop" | "mobile", file: File) => void | Promise<void>;
  onSave: () => Promise<boolean>;
  persistedBanner: PartnerBannerConfig;
  uploadingKey: string | null;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const status = partnerBannerStatus(banner);
  const attention = countAttention([status]);
  const isDirty = !isSameAsset(banner, persistedBanner);

  async function handleSave() {
    const saved = await onSave();
    if (saved) {
      setIsEditing(false);
    }
  }

  const frameNotice =
    issues.length > 0 || (notice && !isEditing) ? (
      <div className="space-y-3">
        {issues.length > 0 ? <AssetWarning>{issues.join(" ")}</AssetWarning> : null}
        {notice && !isEditing ? <AssetNotice notice={notice} /> : null}
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
            Salvar PDV Perfeito
          </button>
        }
        notice={frameNotice}
        summary={`PDV Perfeito · 1 bloco${attentionSuffix(attention)}`}
      >
        <AssetRow
          isUnsaved={isDirty}
          onOpen={() => setIsEditing(true)}
          status={status}
          thumbnail={<AssetThumb imageUrl={banner.desktopImageUrl} label="Bloco PDV Perfeito" />}
          title={banner.tag || "Bloco parceiro"}
          where="Convite para virar parceiro, na home"
        />
      </ResultFrame>

      {isEditing ? (
        <AssetEditorModal
          description="Imagem lateral e textos do bloco PDV Perfeito na home, ao lado do convite para virar parceiro."
          eyebrow="Painel admin · Assets · Home"
          isSaving={isSaving}
          notice={notice}
          onClose={() => setIsEditing(false)}
          onSave={() => void handleSave()}
          open
          saveLabel="Salvar PDV Perfeito"
          size="wide"
          title="Bloco PDV Perfeito"
        >
          <PartnerBannerEditor
            banner={banner}
            onChange={onChange}
            onFileSelect={onFileSelect}
            uploadingKey={uploadingKey}
          />
        </AssetEditorModal>
      ) : null}
    </>
  );
}
