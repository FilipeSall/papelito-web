"use client";

import { useOptimistic, useTransition } from "react";
import { useRouter } from "next/navigation";

import { buildProductsHref } from "./products-query-helpers";
import type {
  ProductCollectionId,
  ProductTypeId,
  ProductsCatalogCategory,
} from "@/features/catalog";
import { toCategoryDisplayLabel } from "@/features/catalog/utils/category-label";
import type { ProductsViewMode } from "@/features/catalog/utils/products-listing-preferences";
import {
  groupSubcategoriesByFacet,
  keepSelectedCategories,
  parseScopedSubcategories,
  replaceCategorySubcategories,
  resolveCheckedSubcategories,
  subcategoriesOfCategory,
  toggleSubcategorySelection,
} from "@/features/catalog/utils/subcategory-selection";

type SpecificType = Exclude<ProductTypeId, "todos">;
type FilterVariant = "default" | "collection";

export interface CategoryFilterOption {
  id: ProductTypeId;
  label: string;
}

interface CategoryFilterTreeProps {
  basePath: string;
  collection: ProductCollectionId;
  options: CategoryFilterOption[];
  categoryTree: ProductsCatalogCategory[];
  selectedTypes: SpecificType[];
  selectedSubcategories: string[];
  minPrice: number | null;
  maxPrice: number | null;
  viewMode: ProductsViewMode;
  perPage: number;
  search?: string;
  variant: FilterVariant;
}

interface Selection {
  types: SpecificType[];
  subcategories: string[];
}

function toggleCategory(current: SpecificType[], target: ProductTypeId): SpecificType[] {
  if (target === "todos") {
    return [];
  }

  const next = new Set(current);

  if (next.has(target)) {
    next.delete(target);
  } else {
    next.add(target);
  }

  return Array.from(next);
}

function CheckboxIndicator({
  checked,
  variant,
  size,
}: {
  checked: boolean;
  variant: FilterVariant;
  size: "parent" | "child";
}) {
  const isCollection = variant === "collection";
  const box = size === "parent" ? "h-4 w-4" : "h-3.5 w-3.5";
  const tick = size === "parent" ? "h-3 w-3" : "h-2.5 w-2.5";

  let tone: string;
  if (checked) {
    tone = isCollection
      ? "border-[#1a1a1a] bg-brand-dark"
      : "border-brand-dark bg-brand-dark";
  } else {
    tone = isCollection
      ? "border-[#1a1a1a] bg-white group-hover:bg-brand-yellow"
      : "border-gray-300 bg-white group-hover:border-brand-dark";
  }

  return (
    <span
      aria-hidden
      className={`inline-flex ${box} shrink-0 items-center justify-center transition-colors peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand-yellow ${
        isCollection ? "border-2 rounded-none" : "border rounded"
      } ${tone}`}
    >
      {checked ? (
        <svg
          className={`${tick} ${isCollection ? "text-brand-yellow" : "text-white"}`}
          fill="none"
          viewBox="0 0 16 16"
        >
          <path
            d="M3.2 8.2L6.2 11.2L12.8 4.8"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
          />
        </svg>
      ) : null}
    </span>
  );
}

interface FilterCheckboxProps {
  checked: boolean;
  label: string;
  level: "parent" | "child";
  onToggle: () => void;
  variant: FilterVariant;
}

function FilterCheckbox({ checked, label, level, onToggle, variant }: FilterCheckboxProps) {
  const isParent = level === "parent";
  const isCollection = variant === "collection";

  let text: string;
  if (isParent) {
    text = `text-sm ${isCollection ? "font-bold" : ""} ${
      checked ? "font-semibold text-brand-dark" : "text-text-secondary"
    }`;
  } else {
    text = `text-[13px] leading-snug ${isCollection ? "font-bold" : ""} ${
      checked ? "font-medium text-brand-dark" : "text-text-secondary"
    }`;
  }

  return (
    <label className="group flex cursor-pointer items-start gap-2 py-0.5">
      <input
        checked={checked}
        className="peer sr-only"
        onChange={onToggle}
        type="checkbox"
      />
      <span className={isParent ? "mt-px" : "mt-[3px]"}>
        <CheckboxIndicator checked={checked} size={level} variant={variant} />
      </span>
      <span className={`${text} transition-colors group-hover:text-brand-dark`}>
        {isParent ? toCategoryDisplayLabel(label) : label}
      </span>
    </label>
  );
}

/**
 * Filtro hierárquico de categoria → subcategoria.
 *
 * A URL continua sendo a fonte de verdade: cada caixa navega para o href que já
 * carrega o resto dos filtros. O estado otimista existe só para a marcação não
 * esperar o servidor — ele é descartado assim que a navegação termina, então não
 * há segunda fonte de verdade nem laço entre router e componente.
 *
 * Cada categoria marcada abre a própria árvore e é refinada de forma independente.
 * Por isso a URL guarda `categoria.subcategoria`: o slug é único dentro da categoria,
 * não no catálogo (`slim` existe em Sedas, Piteiras e Filtros).
 */
export function CategoryFilterTree({
  basePath,
  collection,
  options,
  categoryTree,
  selectedTypes,
  selectedSubcategories,
  minPrice,
  maxPrice,
  viewMode,
  perPage,
  search,
  variant,
}: Readonly<CategoryFilterTreeProps>) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selection, setSelection] = useOptimistic<Selection>({
    types: selectedTypes,
    subcategories: selectedSubcategories,
  });

  const navigate = (next: Selection) => {
    const href = buildProductsHref({
      basePath,
      collection,
      selectedTypes: next.types,
      selectedSubcategories: next.subcategories,
      minPrice,
      maxPrice,
      viewMode,
      perPage,
      search,
    });

    startTransition(() => {
      setSelection(next);
      router.push(href, { scroll: false });
    });
  };

  const scoped = parseScopedSubcategories(selection.subcategories);

  return (
    <div
      aria-busy={isPending || undefined}
      className={`flex flex-col gap-2.5 transition-opacity ${isPending ? "opacity-70" : ""}`}
    >
      {options.map((option) => {
        const isTodos = option.id === "todos";
        const checked = isTodos
          ? selection.types.length === 0
          : selection.types.includes(option.id as SpecificType);
        const tree = checked && !isTodos
          ? categoryTree.find((category) => category.slug === option.id)
          : undefined;
        const subcategories = tree?.subcategories ?? [];
        const categorySelection = subcategoriesOfCategory(
          scoped,
          option.id,
          subcategories,
        );

        return (
          <div key={option.id}>
            <FilterCheckbox
              checked={checked}
              label={option.label}
              level="parent"
              onToggle={() => {
                const types = toggleCategory(selection.types, option.id);

                navigate({
                  types,
                  // Categoria que saiu de cena leva junto o próprio refinamento; as
                  // outras continuam com o delas.
                  subcategories: keepSelectedCategories(selection.subcategories, types),
                });
              }}
              variant={variant}
            />

            {subcategories.length > 0 ? (
              <SubcategoryGroup
                categoryLabel={option.label}
                categorySlug={option.id}
                onToggle={(slug) =>
                  navigate({
                    types: selection.types,
                    subcategories: replaceCategorySubcategories(
                      selection.subcategories,
                      option.id,
                      toggleSubcategorySelection(subcategories, categorySelection, slug),
                      subcategories,
                    ),
                  })
                }
                selectedSubcategories={categorySelection}
                subcategories={subcategories}
                variant={variant}
              />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

interface SubcategoryGroupProps {
  categoryLabel: string;
  categorySlug: string;
  onToggle: (slug: string) => void;
  selectedSubcategories: string[];
  subcategories: ProductsCatalogCategory["subcategories"];
  variant: FilterVariant;
}

function SubcategoryGroup({
  categoryLabel,
  categorySlug,
  onToggle,
  selectedSubcategories,
  subcategories,
  variant,
}: Readonly<SubcategoryGroupProps>) {
  const checked = resolveCheckedSubcategories(subcategories, selectedSubcategories);
  const facets = groupSubcategoriesByFacet(subcategories);
  const showFacetLabels = facets.length > 1;
  const isCollection = variant === "collection";

  return (
    <div className="animate-filter-subtree">
      <div className="overflow-hidden">
        <div
          aria-label={`Subcategorias de ${toCategoryDisplayLabel(categoryLabel)}`}
          className={`mt-2 ml-[7px] pl-3 ${
            isCollection ? "border-l-2 border-[#1a1a1a]" : "border-l border-gray-200"
          }`}
          role="group"
        >
          {facets.map((group, index) => {
            const facetLabelId = `filtro-${categorySlug}-${group.facet}`;

            return (
            <div
              aria-labelledby={showFacetLabels ? facetLabelId : undefined}
              className={index > 0 ? "mt-3" : undefined}
              key={group.facet}
              role={showFacetLabels ? "group" : undefined}
            >
              {showFacetLabels ? (
                <p
                  className="mb-1 text-[10px] font-black uppercase tracking-[0.14em] text-text-muted"
                  id={facetLabelId}
                >
                  {group.facet}
                </p>
              ) : null}
              <div className="flex flex-col gap-1">
                {group.items.map((subcategory) => (
                  <FilterCheckbox
                    checked={checked.has(subcategory.slug)}
                    key={subcategory.slug}
                    label={subcategory.name}
                    level="child"
                    onToggle={() => onToggle(subcategory.slug)}
                    variant={variant}
                  />
                ))}
              </div>
            </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
