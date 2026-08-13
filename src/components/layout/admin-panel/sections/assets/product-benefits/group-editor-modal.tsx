"use client";

import { Plus, X } from "lucide-react";
import { useState } from "react";

import type { RichTextResolutionContext } from "@/features/rich-text";
import type { AdminCategory } from "@/lib/server/admin-taxonomy";
import type { AdminBenefitGroup, BenefitGroupTargets } from "@/types/product-benefits";

import {
  BUTTON_CLASS,
  INPUT_CLASS,
  LABEL_CLASS,
  MUTED_TEXT_CLASS,
  SECONDARY_BUTTON_CLASS,
} from "../field-classes";
import {
  BENEFIT_TITLE_MAX_LENGTH,
  BenefitItemRow,
  type BenefitItemDraft,
} from "./benefit-item-row";
import { GroupTargetsField } from "./group-targets-field";
import { ProductBenefitsPreview } from "./product-benefits-preview";

export type BenefitGroupFormValues = {
  isActive: boolean;
  items: BenefitItemDraft[];
  name: string;
  targets: BenefitGroupTargets;
};

let draftCounter = 0;

function nextKey() {
  draftCounter += 1;
  return `draft-${draftCounter}`;
}

function emptyItem(): BenefitItemDraft {
  return {
    key: nextKey(),
    id: 0,
    iconType: "emoji",
    iconEmoji: "⭐",
    iconAttachmentId: 0,
    iconUrl: "",
    title: "",
    description: "",
    descriptionContent: null,
    sortOrder: 0,
    isActive: true,
  };
}

export function toDrafts(group: AdminBenefitGroup | null): BenefitItemDraft[] {
  return (group?.items ?? []).map((item) => ({ ...item, key: `item-${item.id}` }));
}

export function GroupEditorModal({
  categories,
  collections,
  group,
  isSaving,
  onClose,
  onSave,
  onUploadIcon,
  productNames,
  richTextContext,
  uploadingKey,
}: Readonly<{
  categories: AdminCategory[];
  collections: string[];
  group: AdminBenefitGroup | null;
  isSaving: boolean;
  onClose: () => void;
  onSave: (values: BenefitGroupFormValues) => void;
  onUploadIcon: (key: string, file: File) => Promise<{ id: number; src: string } | null>;
  productNames: Record<number, string>;
  richTextContext: RichTextResolutionContext;
  uploadingKey: string | null;
}>) {
  const [name, setName] = useState(group?.name ?? "");
  const [isActive, setIsActive] = useState(group?.isActive ?? true);
  const [items, setItems] = useState<BenefitItemDraft[]>(toDrafts(group));
  const [targets, setTargets] = useState<BenefitGroupTargets>(
    group?.targets ?? { products: [], collections: [], categories: [] },
  );
  const [error, setError] = useState("");

  const isGlobal = group?.isGlobal ?? false;

  function patchItem(key: string, patch: Partial<BenefitItemDraft>) {
    setItems((current) =>
      current.map((item) => (item.key === key ? { ...item, ...patch } : item)),
    );
  }

  function moveItem(key: string, direction: -1 | 1) {
    setItems((current) => {
      const index = current.findIndex((item) => item.key === key);
      const target = index + direction;

      if (index === -1 || target < 0 || target >= current.length) {
        return current;
      }

      const ordered = [...current];
      [ordered[index], ordered[target]] = [ordered[target], ordered[index]];
      return ordered;
    });
  }

  async function handleUploadIcon(key: string, file: File) {
    const media = await onUploadIcon(key, file);

    if (media) {
      patchItem(key, { iconAttachmentId: media.id, iconUrl: media.src });
    }
  }

  function handleSubmit() {
    if (name.trim() === "") {
      setError("Informe um nome para a configuração.");
      return;
    }

    const untitled = items.findIndex((item) => item.title.trim() === "");

    if (untitled !== -1) {
      setError(`O benefício ${untitled + 1} precisa de um título.`);
      return;
    }

    const iconless = items.findIndex((item) =>
      item.iconType === "emoji" ? item.iconEmoji.trim() === "" : item.iconUrl === "",
    );

    if (iconless !== -1) {
      setError(`O benefício ${iconless + 1} precisa de um ícone.`);
      return;
    }

    setError("");
    onSave({ isActive, items, name: name.trim(), targets });
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[#231f20]/70 p-4">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-auto border-2 border-[#1a1a1a] bg-[#faf8f2] shadow-[8px_8px_0px_#1a1a1a]">
        <div className="h-2 w-full bg-brand-yellow" />
        <div className="flex items-center justify-between gap-4 border-b-2 border-[#1a1a1a] p-5">
          <h3 className="text-sm font-black uppercase tracking-[0.18em] text-[#1a1a1a]">
            {group ? "Editar configuração" : "Nova configuração"}
          </h3>
          <button
            aria-label="Fechar"
            className="cursor-pointer border-2 border-[#1a1a1a] bg-white p-1.5 text-[#1a1a1a] transition hover:bg-brand-yellow"
            onClick={onClose}
            type="button"
          >
            <X aria-hidden className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-5 p-5">
          <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto]">
            <div>
              <label className={LABEL_CLASS} htmlFor="benefit-group-name">
                Nome interno
              </label>
              <input
                className={INPUT_CLASS}
                disabled={isSaving}
                id="benefit-group-name"
                maxLength={120}
                onChange={(event) => setName(event.target.value)}
                value={name}
              />
            </div>

            {isGlobal ? null : (
              <label className="flex items-end gap-2 pb-3 text-[11px] font-black uppercase tracking-[0.12em] text-[#1a1a1a]">
                <input
                  checked={isActive}
                  className="h-4 w-4 accent-[#1a1a1a]"
                  disabled={isSaving}
                  onChange={(event) => setIsActive(event.target.checked)}
                  type="checkbox"
                />
                Ativa
              </label>
            )}
          </div>

          {isGlobal ? (
            <p className="border-2 border-[#1a1a1a] bg-brand-yellow/35 px-4 py-3 text-sm font-bold leading-6 text-[#1a1a1a]">
              Esta é a configuração global: vale para todo produto que não tenha uma configuração
              mais específica. Ela não pode ser desativada nem excluída.
            </p>
          ) : (
            <section className="space-y-2">
              <h4 className="text-[11px] font-black uppercase tracking-[0.22em] text-[#1a1a1a]">
                Onde se aplica
              </h4>
              <p className={MUTED_TEXT_CLASS}>
                Produto vence coleção, que vence categoria, que vence a configuração global. Um
                produto, uma coleção ou uma categoria pertence a uma configuração só.
              </p>
              <GroupTargetsField
                categories={categories}
                collections={collections}
                disabled={isSaving}
                onChange={setTargets}
                productNames={productNames}
                targets={targets}
              />
            </section>
          )}

          <section className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h4 className="text-[11px] font-black uppercase tracking-[0.22em] text-[#1a1a1a]">
                Benefícios ({items.length})
              </h4>
              <button
                className={SECONDARY_BUTTON_CLASS}
                disabled={isSaving}
                onClick={() => setItems((current) => [...current, emptyItem()])}
                type="button"
              >
                <Plus aria-hidden className="h-4 w-4" />
                Adicionar benefício
              </button>
            </div>

            {items.length === 0 ? (
              <p className="border-2 border-dashed border-[#1a1a1a]/25 bg-white px-4 py-8 text-center text-sm font-semibold uppercase tracking-[0.14em] text-[#231f20]/50">
                nenhum benefício nesta configuração
              </p>
            ) : (
              <ul className="space-y-3">
                {items.map((item, index) => (
                  <BenefitItemRow
                    canMoveDown={index < items.length - 1}
                    canMoveUp={index > 0}
                    disabled={isSaving}
                    index={index}
                    item={item}
                    key={item.key}
                    onChange={patchItem}
                    onMove={moveItem}
                    onRemove={(key) =>
                      setItems((current) => current.filter((entry) => entry.key !== key))
                    }
                    onUploadIcon={handleUploadIcon}
                    richTextContext={richTextContext}
                    uploadingKey={uploadingKey}
                  />
                ))}
              </ul>
            )}
          </section>

          <ProductBenefitsPreview items={items} richTextContext={richTextContext} />

          {error === "" ? null : (
            <p className="border-2 border-[#c0392b] bg-white px-4 py-3 text-sm font-semibold text-[#c0392b]">
              ⚠ {error}
            </p>
          )}

          <div className="flex flex-wrap justify-end gap-2 border-t-2 border-[#1a1a1a] pt-4">
            <button
              className={SECONDARY_BUTTON_CLASS}
              disabled={isSaving}
              onClick={onClose}
              type="button"
            >
              Cancelar
            </button>
            <button
              className={BUTTON_CLASS}
              disabled={isSaving}
              onClick={handleSubmit}
              type="button"
            >
              {isSaving ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export { BENEFIT_TITLE_MAX_LENGTH };
