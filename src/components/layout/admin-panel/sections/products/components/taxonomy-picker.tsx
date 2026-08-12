"use client";

import { useMemo } from "react";

import type { AdminCategory } from "@/lib/server/admin-taxonomy";

import { AdminSelectField } from "./admin-select-field";
import { FieldLabel } from "./form-fields";

const FACET_LABELS: Record<string, string> = {
  formato: "Formato",
  geral: "Geral",
  linha: "Linha",
  material: "Material",
  tamanho: "Tamanho",
  tipo: "Tipo",
};

const COLLECTION_LABELS: Record<string, string> = {
  kits: "Kits",
  premium: "Premium",
};

function facetLabel(facet: string) {
  return FACET_LABELS[facet] ?? facet.charAt(0).toUpperCase() + facet.slice(1);
}

function collectionLabel(slug: string) {
  return COLLECTION_LABELS[slug] ?? slug;
}

type TaxonomyPickerProps = {
  categories: AdminCategory[];
  collections: string[];
  isLoading?: boolean;
  onCategoryChange: (categoryId: string) => void;
  onToggleCollection: (slug: string) => void;
  onToggleSubcategory: (subcategoryId: string) => void;
  selectedCategoryId: string;
  selectedCollections: string[];
  selectedSubcategoryIds: string[];
};

export function TaxonomyPicker({
  categories,
  collections,
  isLoading = false,
  onCategoryChange,
  onToggleCollection,
  onToggleSubcategory,
  selectedCategoryId,
  selectedCollections,
  selectedSubcategoryIds,
}: TaxonomyPickerProps) {
  const activeCategories = useMemo(
    () => categories.filter((category) => category.isActive && !category.archivedAt),
    [categories],
  );

  const selectedCategory = useMemo(
    () => categories.find((category) => String(category.id) === selectedCategoryId) ?? null,
    [categories, selectedCategoryId],
  );

  /**
   * Subcategoria inativa continua visível quando o produto já a tem — some da
   * lista, mas não some do produto sem o admin ver.
   */
  const facetGroups = useMemo(() => {
    if (!selectedCategory) {
      return [];
    }

    const groups = new Map<string, AdminCategory["subcategories"]>();

    for (const subcategory of selectedCategory.subcategories) {
      const isSelected = selectedSubcategoryIds.includes(String(subcategory.id));
      const isAvailable = subcategory.isActive && !subcategory.archivedAt;

      if (!isAvailable && !isSelected) {
        continue;
      }

      groups.set(subcategory.facet, [...(groups.get(subcategory.facet) ?? []), subcategory]);
    }

    return Array.from(groups.entries()).map(([facet, subcategories]) => ({
      facet,
      subcategories,
    }));
  }, [selectedCategory, selectedSubcategoryIds]);

  const categoryOptions = useMemo(
    () =>
      activeCategories.map((category) => ({
        label: category.name,
        value: String(category.id),
      })),
    [activeCategories],
  );

  return (
    <div className="space-y-5">
      <div className="grid gap-2">
        <AdminSelectField
          helpText="Um produto tem exatamente uma categoria principal. Trocar a categoria limpa as subcategorias, porque elas pertencem à categoria anterior."
          label="Categoria *"
          onChange={onCategoryChange}
          options={categoryOptions}
          placeholder={isLoading ? "Carregando…" : "Selecione a categoria"}
          value={selectedCategoryId}
        />
        {!selectedCategoryId && !isLoading ? (
          <p className="text-xs font-semibold text-[#c0392b]">
            ⚠ Escolha a categoria para poder salvar.
          </p>
        ) : null}
      </div>

      {selectedCategory ? (
        <div className="grid gap-3">
          <FieldLabel
            helpText="Um produto pode ter várias subcategorias. Dentro de um mesmo grupo elas se somam — uma seda pode ser Brown e Slim ao mesmo tempo."
            label="Subcategorias"
          />
          {facetGroups.length === 0 ? (
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#231f20]/42">
              esta categoria ainda não tem subcategorias
            </p>
          ) : (
            <div className="space-y-4">
              {facetGroups.map((group) => (
                <fieldset className="grid gap-2" key={group.facet}>
                  <legend className="mb-1 flex items-center gap-2">
                    <span className="inline-block h-2 w-2 rotate-45 bg-brand-yellow" />
                    <span className="text-[10px] font-black uppercase tracking-[0.18em] text-[#1a1a1a]">
                      {facetLabel(group.facet)}
                    </span>
                  </legend>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                    {group.subcategories.map((subcategory) => {
                      const id = String(subcategory.id);
                      const isArchived = !subcategory.isActive || Boolean(subcategory.archivedAt);
                      const isSelected = selectedSubcategoryIds.includes(id);

                      return (
                        <label
                          className="flex items-center gap-2 text-sm leading-5 text-[#231f20] transition has-disabled:cursor-not-allowed has-disabled:opacity-60 has-[input:not(:disabled)]:cursor-pointer has-[input:not(:disabled)]:hover:text-[#8b3f2d]"
                          key={subcategory.id}
                        >
                          <input
                            checked={isSelected}
                            className="h-4 w-4 accent-[#ffe500]"
                            disabled={isArchived}
                            onChange={() => onToggleSubcategory(id)}
                            type="checkbox"
                          />
                          <span className="min-w-0 flex-1 truncate">
                            {subcategory.name}
                            {isArchived ? (
                              <span className="ml-1 text-[10px] font-black uppercase tracking-[0.14em] text-[#c0392b]">
                                inativa
                              </span>
                            ) : null}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </fieldset>
              ))}
            </div>
          )}
        </div>
      ) : null}

      {collections.length > 0 ? (
        <div className="grid gap-2">
          <FieldLabel
            helpText="Coleções são recortes comerciais que atravessam categorias — uma seda Premium continua sendo uma seda."
            label="Coleções"
          />
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            {collections.map((slug) => (
              <label
                className="flex cursor-pointer items-center gap-2 text-sm leading-5 text-[#231f20] transition hover:text-[#8b3f2d]"
                key={slug}
              >
                <input
                  checked={selectedCollections.includes(slug)}
                  className="h-4 w-4 accent-[#ffe500]"
                  onChange={() => onToggleCollection(slug)}
                  type="checkbox"
                />
                {collectionLabel(slug)}
              </label>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
