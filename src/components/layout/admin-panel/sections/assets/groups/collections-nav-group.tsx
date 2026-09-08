"use client";

import { ArrowDown, ArrowUp, Compass, LoaderCircle, Plus, Save, Trash2 } from "lucide-react";
import { useState } from "react";

import { ResultFrame } from "@/components/layout/admin-panel/primitives";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import {
  COLLECTION_NAV_MAX_ITEMS,
  getCollectionsNavValidation,
} from "@/components/layout/categories-nav/collections-nav-validation";
import { COLLECTION_NAV_TILTS } from "@/lib/home-collections-nav";
import type { CollectionNavItem } from "@/types/home-assets";

import { AssetEditorModal } from "../asset-editor-modal";
import { AssetNotice, AssetWarning, type AssetNoticeState } from "../asset-notice";
import { AssetEmptyRow, AssetRow, AssetThumb } from "../asset-row";
import {
  COMPACT_DESTRUCTIVE_CLASS,
  COMPACT_PRIMARY_CLASS,
  COMPACT_SECONDARY_CLASS,
  HARD_BOX_CLASS,
  ROW_ICON_BUTTON_CLASS,
} from "../assets-classes";
import { isSameAsset } from "../assets-dirty";
import { attentionSuffix, collectionNavItemStatus, countAttention } from "../assets-status";
import {
  CollectionNavItemEditor,
  type CollectionImagePatch,
  type CollectionNavDestinationOption,
} from "../editors/collection-nav-item-editor";

export function CollectionsNavGroup({
  collectionOptions,
  isSaving,
  issues,
  items,
  notice,
  onAdd,
  onChange,
  onCollectionImageChange,
  onMove,
  onRemove,
  onSave,
  persistedItems,
}: {
  collectionOptions: CollectionNavDestinationOption[];
  isSaving: boolean;
  issues: string[];
  items: CollectionNavItem[];
  notice: AssetNoticeState | null;
  onAdd: () => string;
  onChange: (id: string, patch: Partial<CollectionNavItem>) => void;
  onCollectionImageChange?: (collectionId: number, patch: CollectionImagePatch) => Promise<boolean>;
  onMove: (id: string, direction: -1 | 1) => void;
  onRemove: (id: string) => void;
  onSave: () => Promise<boolean>;
  persistedItems: CollectionNavItem[];
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [itemToRemove, setItemToRemove] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const validation = getCollectionsNavValidation(items);
  const statuses = items.map(collectionNavItemStatus);
  const attention = countAttention(statuses);
  const isDirty = !isSameAsset(items, persistedItems);
  const editingIndex = items.findIndex((item) => item.id === editingId);
  const editingItem = editingIndex >= 0 ? items[editingIndex] : null;

  // A prévia usa só o que está no formulário. Resolver o número ao vivo aqui custaria uma varredura
  // do catálogo inteiro a cada abertura do painel — o card ligado a uma coleção ganha um selo em vez
  // disso, dizendo que o texto é trocado na Home.
  const previewItems = items
    .filter((item) => item.isActive)
    .map((item, index) => ({
      href: item.href,
      hasLiveNumber: Boolean(item.highlight?.text || (item.indicatorKey && item.indicatorKey !== "NONE")),
      highlight: item.highlight?.text,
      id: item.id,
      subtitle: item.subtitle,
      tilt: COLLECTION_NAV_TILTS[index % COLLECTION_NAV_TILTS.length],
      title: item.title,
    }));

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
          <>
            <button
              className={COMPACT_SECONDARY_CLASS}
              disabled={isSaving || collectionOptions.length === 0 || items.length >= COLLECTION_NAV_MAX_ITEMS}
              onClick={() => setEditingId(onAdd())}
              type="button"
            >
              <Plus aria-hidden className="h-4 w-4" strokeWidth={2.4} />
              Novo card
            </button>
            <button
              className={COMPACT_PRIMARY_CLASS}
              disabled={isSaving || isUploadingImage || !isDirty || !validation.isValid}
              onClick={() => void handleSave()}
              type="button"
            >
              {isSaving ? (
                <LoaderCircle aria-hidden className="h-4 w-4 animate-spin" />
              ) : (
                <Save aria-hidden className="h-4 w-4" strokeWidth={2.4} />
              )}
              Salvar corredor
            </button>
          </>
        }
        notice={
          <div className="space-y-3">
            {!validation.isValid ? <AssetWarning>{validation.message}</AssetWarning> : null}
            {issues.length > 0 ? <AssetWarning>{issues.join(" ")}</AssetWarning> : null}
            {notice && !editingId ? <AssetNotice notice={notice} /> : null}

            <div className={HARD_BOX_CLASS}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#231f20]/56">
                  Prévia — a seção como ela aparece na Home
                </p>
                <span className="inline-flex shrink-0 items-center border-2 border-[#1a1a1a] bg-brand-yellow px-2 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-[#1a1a1a]">
                  {previewItems.length} visíve{previewItems.length === 1 ? "l" : "is"}
                </span>
              </div>

              {previewItems.length > 0 ? (
                <div className="mt-4 flex flex-col items-center gap-5 bg-[#faf8f2] px-3 py-6">
                  <p className="flex items-center gap-2 text-sm font-black uppercase leading-none tracking-[-0.02em] text-brand-dark">
                    <span aria-hidden className="inline-block size-2 rounded-full bg-brand-yellow" />
                    Explore por coleção
                  </p>
                  <ul className="flex flex-wrap items-center justify-center gap-3">
                    {previewItems.map((item) => (
                      <li key={`${item.id}-preview`}>
                        <span
                          className="inline-flex min-w-0 flex-col items-center gap-1 border-2 border-brand-dark px-4 py-2 text-center"
                          style={{ transform: `rotate(${item.tilt}deg)` }}
                        >
                          <span className="text-xs font-black uppercase leading-none tracking-[0.06em] text-brand-dark">
                            {item.title}
                          </span>
                          <span className="text-[0.5rem] font-black uppercase leading-3 tracking-[0.14em] text-text-secondary">
                            {item.subtitle}
                          </span>
                          {item.hasLiveNumber ? (
                            <span className="text-[0.5rem] font-black uppercase leading-3 tracking-[0.1em] text-[#231f20]/45">
                            {item.highlight || "destaque calculado ao vivo"}
                            </span>
                          ) : null}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="mt-3 border-2 border-dashed border-[#1a1a1a]/25 px-3 py-6 text-center text-[11px] font-black uppercase tracking-[0.12em] text-[#231f20]/48">
                  A seção some da Home sem card visível.
                </p>
              )}
            </div>
          </div>
        }
        summary={`Explore por coleção · ${items.length} card${items.length === 1 ? "" : "s"}${attentionSuffix(attention)}`}
      >
        {items.length === 0 ? (
          <AssetEmptyRow
            body="A seção fica oculta na Home enquanto não houver card ativo. Crie o primeiro para começar."
            title="Nenhum card cadastrado"
          />
        ) : null}

        {collectionOptions.length === 0 ? (
          <div className="flex items-start gap-3 border-2 border-dashed border-[#1a1a1a]/30 bg-[#faf8f2] p-4">
            <Compass aria-hidden className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p className="text-sm font-black">Todas as coleções já estão na tela.</p>
              <p className="mt-1 text-xs font-semibold text-[#231f20]/65">{items.length === 1 ? "Há 1 coleção ativa cadastrada" : `Há ${items.length} coleções ativas cadastradas`}, e cada uma pode aparecer uma vez. Crie outra coleção para adicionar mais cards, até o limite de {COLLECTION_NAV_MAX_ITEMS}.</p>
            </div>
          </div>
        ) : null}

        {items.length >= COLLECTION_NAV_MAX_ITEMS && collectionOptions.length > 0 ? (
          <div className="border-2 border-dashed border-[#1a1a1a]/30 bg-[#faf8f2] p-4 text-sm font-semibold text-[#231f20]/70">
            Limite de {COLLECTION_NAV_MAX_ITEMS} coleções atingido. Remova um card para adicionar outra coleção.
          </div>
        ) : null}

        {items.map((item, index) => (
          <AssetRow
            actions={
              <span className="flex items-center gap-2">
                <button
                  aria-label={`Subir card ${index + 1}`}
                  className={ROW_ICON_BUTTON_CLASS}
                  disabled={isSaving || index === 0}
                  onClick={() => onMove(item.id, -1)}
                  type="button"
                >
                  <ArrowUp aria-hidden className="h-3.5 w-3.5" strokeWidth={2.4} />
                </button>
                <button
                  aria-label={`Descer card ${index + 1}`}
                  className={ROW_ICON_BUTTON_CLASS}
                  disabled={isSaving || index === items.length - 1}
                  onClick={() => onMove(item.id, 1)}
                  type="button"
                >
                  <ArrowDown aria-hidden className="h-3.5 w-3.5" strokeWidth={2.4} />
                </button>
                <button
                  aria-label={`Remover card ${index + 1}`}
                  className={COMPACT_DESTRUCTIVE_CLASS}
                  disabled={isSaving}
                  onClick={() => setItemToRemove(item.id)}
                  type="button"
                >
                  <Trash2 aria-hidden className="h-3.5 w-3.5" strokeWidth={2.4} />
                </button>
              </span>
            }
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
                imageUrl={item.collectionData?.imageUrl ?? ""}
                label={`Card ${index + 1}`}
                tone={item.isActive ? "yellow" : "light"}
              />
            }
            title={item.title.trim() || `Card ${index + 1} sem título`}
            where={`Posição ${item.order} · ${item.href.trim() || "sem destino"}`}
          />
        ))}
      </ResultFrame>

      {editingItem ? (
        <AssetEditorModal
          description="Escolha uma coleção; rota e destaque vêm dela. Você também pode atualizar aqui a imagem canônica da coleção. A ordem da lista é a ordem pública."
          eyebrow="Painel admin · Assets · Home"
          isSaveDisabled={isUploadingImage || !validation.isValid}
          isSaving={isSaving || isUploadingImage}
          notice={notice}
          onClose={() => setEditingId(null)}
          onSave={() => void handleSave()}
          open
          saveLabel="Salvar corredor"
          title={`Explore por coleção · card ${editingIndex + 1}`}
        >
          <CollectionNavItemEditor
            collectionOptions={collectionOptions.filter(
              (option) =>
                !items.some(
                  (other) =>
                    other.id !== editingItem.id &&
                    other.isActive &&
                    other.collectionId === option.id,
                ),
            )}
            index={editingIndex}
            isNew={editingItem.collectionId == null}
            isSaving={isSaving}
            item={editingItem}
            onChange={(patch) => onChange(editingItem.id, patch)}
            onCollectionImageChange={onCollectionImageChange}
            onUploadingChange={setIsUploadingImage}
          />
        </AssetEditorModal>
      ) : null}

      <ConfirmModal
        confirmLabel="Remover card"
        description="O card sai do corredor de coleções da Home assim que você salvar as alterações."
        onClose={() => setItemToRemove(null)}
        onConfirm={() => {
          if (itemToRemove) {
            onRemove(itemToRemove);
            if (editingId === itemToRemove) {
              setEditingId(null);
            }
          }
          setItemToRemove(null);
        }}
        open={itemToRemove !== null}
        title="Remover card do corredor"
        tone="danger"
      />
    </>
  );
}
