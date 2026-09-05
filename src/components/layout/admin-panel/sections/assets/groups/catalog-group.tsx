"use client";

import { FileText } from "lucide-react";
import { useState } from "react";

import { ResultFrame } from "@/components/layout/admin-panel/primitives";

import { AssetEditorModal } from "../asset-editor-modal";
import { AssetNotice } from "../asset-notice";
import { AssetIconThumb, AssetRow } from "../asset-row";
import { ASSET_STATUS, attentionSuffix, countAttention } from "../assets-status";

import { CatalogPdfPanel } from "./catalog-pdf-panel";
import { useCatalogPdf } from "./use-catalog-pdf";

export function CatalogGroup() {
  const [isEditing, setIsEditing] = useState(false);
  const { isLoading, isRestoring, isUploading, notice, restoreDefault, snapshot, uploadCatalog } =
    useCatalogPdf();

  const active = snapshot?.activeCatalog;
  const status = isLoading
    ? ASSET_STATUS.loading
    : snapshot?.configuredCatalog?.isAvailable === false
      ? ASSET_STATUS.unavailableFile
      : active?.source === "custom"
        ? ASSET_STATUS.configured
        : ASSET_STATUS.projectDefault;

  return (
    <>
      <ResultFrame
        notice={notice && !isEditing ? <AssetNotice notice={notice} /> : null}
        summary={`Catálogo comercial · 1 arquivo${attentionSuffix(countAttention([status]))}`}
      >
        <AssetRow
          onOpen={() => setIsEditing(true)}
          status={status}
          thumbnail={<AssetIconThumb icon={FileText} label="PDF do catálogo" tone="yellow" />}
          title={active?.filename ?? "catalogo-papelito.pdf"}
          where="Botão de catálogo em /revendedor"
        />
      </ResultFrame>

      {isEditing ? (
        <AssetEditorModal
          description="O PDF aberto pelo botão da página de revendedores. Enviar substitui o arquivo na hora — não há um segundo passo de publicação."
          eyebrow="Painel admin · Assets · Revendedor"
          notice={notice}
          onClose={() => setIsEditing(false)}
          open
          title="PDF do catálogo"
        >
          <CatalogPdfPanel
            isLoading={isLoading}
            isRestoring={isRestoring}
            isUploading={isUploading}
            onRestore={restoreDefault}
            onUpload={uploadCatalog}
            snapshot={snapshot}
          />
        </AssetEditorModal>
      ) : null}
    </>
  );
}
