"use client";

import { ArrowDown, ArrowUp, ImagePlus, LoaderCircle, Save, Trash2 } from "lucide-react";
import { useState } from "react";

import { ResultFrame } from "@/components/layout/admin-panel/primitives";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import type { HeroBanner } from "@/types/home-assets";

import { AssetEditorModal } from "../asset-editor-modal";
import { AssetNotice, AssetWarning, type AssetNoticeState } from "../asset-notice";
import { AssetRow, AssetThumb } from "../asset-row";
import {
  COMPACT_DESTRUCTIVE_CLASS,
  COMPACT_PRIMARY_CLASS,
  COMPACT_SECONDARY_CLASS,
  ROW_ICON_BUTTON_CLASS,
} from "../assets-classes";
import { isSameAsset } from "../assets-dirty";
import { attentionSuffix, countAttention, heroBannerStatus } from "../assets-status";
import { HeroBannerEditor } from "../editors/hero-banner-editor";

export function HeroGroup({
  banners,
  isSaving,
  issues,
  notice,
  onAdd,
  onChange,
  onFileSelect,
  onMove,
  onRemove,
  onSave,
  persistedBanners,
  uploadingKey,
}: {
  banners: HeroBanner[];
  isSaving: boolean;
  issues: string[];
  notice: AssetNoticeState | null;
  onAdd: () => string;
  onChange: (id: string, patch: Partial<HeroBanner>) => void;
  onFileSelect: (id: string, field: "desktop" | "mobile", file: File) => void | Promise<void>;
  onMove: (id: string, direction: -1 | 1) => void;
  onRemove: (id: string) => void;
  onSave: () => Promise<boolean>;
  persistedBanners: HeroBanner[];
  uploadingKey: string | null;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [bannerToRemove, setBannerToRemove] = useState<string | null>(null);
  const statuses = banners.map(heroBannerStatus);
  const attention = countAttention(statuses);
  const isDirty = !isSameAsset(banners, persistedBanners);
  const editingIndex = banners.findIndex((banner) => banner.id === editingId);
  const editingBanner = editingIndex >= 0 ? banners[editingIndex] : null;

  async function handleSave() {
    const saved = await onSave();
    if (saved) {
      setEditingId(null);
    }
  }

  const frameNotice =
    issues.length > 0 || (notice && !editingId) ? (
      <div className="space-y-3">
        {issues.length > 0 ? <AssetWarning>{issues.join(" ")}</AssetWarning> : null}
        {notice && !editingId ? <AssetNotice notice={notice} /> : null}
      </div>
    ) : null;

  return (
    <>
      <ResultFrame
        action={
          <>
            <button
              className={COMPACT_SECONDARY_CLASS}
              disabled={isSaving}
              onClick={() => setEditingId(onAdd())}
              type="button"
            >
              <ImagePlus aria-hidden className="h-4 w-4" strokeWidth={2.4} />
              Nova opção
            </button>
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
              Salvar Hero
            </button>
          </>
        }
        notice={frameNotice}
        summary={`Hero Section · ${banners.length} opç${banners.length === 1 ? "ão" : "ões"}${attentionSuffix(attention)}`}
      >
        {banners.map((banner, index) => (
          <AssetRow
            actions={
              <span className="flex items-center gap-2">
                <button
                  aria-label={`Subir opção ${index + 1}`}
                  className={ROW_ICON_BUTTON_CLASS}
                  disabled={isSaving || index === 0}
                  onClick={() => onMove(banner.id, -1)}
                  type="button"
                >
                  <ArrowUp aria-hidden className="h-3.5 w-3.5" strokeWidth={2.4} />
                </button>
                <button
                  aria-label={`Descer opção ${index + 1}`}
                  className={ROW_ICON_BUTTON_CLASS}
                  disabled={isSaving || index === banners.length - 1}
                  onClick={() => onMove(banner.id, 1)}
                  type="button"
                >
                  <ArrowDown aria-hidden className="h-3.5 w-3.5" strokeWidth={2.4} />
                </button>
                <button
                  aria-label={`Remover opção ${index + 1}`}
                  className={COMPACT_DESTRUCTIVE_CLASS}
                  disabled={isSaving || banners.length <= 1}
                  onClick={() => setBannerToRemove(banner.id)}
                  type="button"
                >
                  <Trash2 aria-hidden className="h-3.5 w-3.5" strokeWidth={2.4} />
                </button>
              </span>
            }
            isUnsaved={
              !isSameAsset(
                banner,
                persistedBanners.find((persisted) => persisted.id === banner.id),
              )
            }
            key={banner.id}
            onOpen={() => setEditingId(banner.id)}
            status={statuses[index]}
            thumbnail={<AssetThumb imageUrl={banner.desktopImageUrl} label={`Opção ${index + 1}`} />}
            title={`Opção ${index + 1}`}
            where={`Ordem ${banner.order} no topo da home`}
          />
        ))}
      </ResultFrame>

      {editingBanner ? (
        <AssetEditorModal
          description="Com uma opção a Hero vira banner fixo; com mais de uma vira carrossel. Sempre deve existir pelo menos uma opção."
          eyebrow="Painel admin · Assets · Home"
          isSaving={isSaving}
          notice={notice}
          onClose={() => setEditingId(null)}
          onSave={() => void handleSave()}
          open
          saveLabel="Salvar Hero"
          size="wide"
          title={`Hero Section · opção ${editingIndex + 1}`}
        >
          <HeroBannerEditor
            banner={editingBanner}
            onChange={(patch) => onChange(editingBanner.id, patch)}
            onFileSelect={(field, file) => onFileSelect(editingBanner.id, field, file)}
            uploadingKey={uploadingKey}
          />
        </AssetEditorModal>
      ) : null}

      <ConfirmModal
        confirmLabel="Remover opção"
        description="A opção sai da Hero Section assim que você salvar as alterações."
        onClose={() => setBannerToRemove(null)}
        onConfirm={() => {
          if (bannerToRemove) {
            onRemove(bannerToRemove);
            if (editingId === bannerToRemove) {
              setEditingId(null);
            }
          }
          setBannerToRemove(null);
        }}
        open={bannerToRemove !== null}
        title="Remover opção da Hero"
        tone="danger"
      />
    </>
  );
}
