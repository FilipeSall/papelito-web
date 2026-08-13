"use client";

import { Plus, Search, X } from "lucide-react";
import { useState } from "react";

import type { AdminCategory } from "@/lib/server/admin-taxonomy";
import type { BenefitGroupTargets } from "@/types/product-benefits";
import { messageFromError } from "@/utils/error-message";

import {
  COMPACT_BUTTON_CLASS,
  INPUT_CLASS,
  LABEL_CLASS,
  MUTED_TEXT_CLASS,
  SUBPANEL_CLASS,
} from "../field-classes";

type ProductOption = { id: number; name: string };

/**
 * Busca de produtos do painel.
 *
 * A rota é a mesma que o flash-sale usa: apesar do nome, é uma busca paginada
 * genérica de produtos com filtro de categoria. Criar um segundo endpoint com o
 * mesmo comportamento só para trocar o rótulo seria duplicação.
 */
const PRODUCT_SEARCH_API = "/api/admin/flash-sale/products";

export function GroupTargetsField({
  categories,
  collections,
  disabled,
  onChange,
  productNames,
  targets,
}: Readonly<{
  categories: AdminCategory[];
  collections: string[];
  disabled: boolean;
  onChange: (targets: BenefitGroupTargets) => void;
  productNames: Record<number, string>;
  targets: BenefitGroupTargets;
}>) {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<ProductOption[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [names, setNames] = useState<Record<number, string>>(productNames);

  async function runSearch() {
    const term = search.trim();

    if (term === "") {
      setResults([]);
      return;
    }

    setIsSearching(true);
    setSearchError("");

    try {
      const response = await fetch(
        `${PRODUCT_SEARCH_API}?search=${encodeURIComponent(term)}&perPage=10`,
      );
      const json = (await response.json().catch(() => null)) as {
        items?: ProductOption[];
        message?: string;
      } | null;

      if (!response.ok) {
        throw new Error(json?.message ?? "Não foi possível buscar produtos.");
      }

      setResults(Array.isArray(json?.items) ? json.items : []);
    } catch (error) {
      setResults([]);
      setSearchError(messageFromError(error, "Não foi possível buscar produtos."));
    } finally {
      setIsSearching(false);
    }
  }

  function toggleCollection(slug: string) {
    onChange({
      ...targets,
      collections: targets.collections.includes(slug)
        ? targets.collections.filter((item) => item !== slug)
        : [...targets.collections, slug],
    });
  }

  function toggleCategory(categoryId: number) {
    onChange({
      ...targets,
      categories: targets.categories.includes(categoryId)
        ? targets.categories.filter((item) => item !== categoryId)
        : [...targets.categories, categoryId],
    });
  }

  function addProduct(product: ProductOption) {
    setNames((current) => ({ ...current, [product.id]: product.name }));

    if (!targets.products.includes(product.id)) {
      onChange({ ...targets, products: [...targets.products, product.id] });
    }
  }

  return (
    <div className="space-y-4">
      <div className={`${SUBPANEL_CLASS} space-y-3`}>
        <span className={LABEL_CLASS}>Coleções</span>
        {collections.length === 0 ? (
          <p className={MUTED_TEXT_CLASS}>Nenhuma coleção curada disponível.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {collections.map((slug) => (
              <label
                className="flex cursor-pointer items-center gap-2 border-2 border-[#1a1a1a]/20 bg-white px-3 py-2 text-xs font-black uppercase tracking-[0.12em] text-[#1a1a1a] has-checked:border-[#1a1a1a] has-checked:bg-brand-yellow"
                key={slug}
              >
                <input
                  checked={targets.collections.includes(slug)}
                  className="h-4 w-4 accent-[#1a1a1a]"
                  disabled={disabled}
                  onChange={() => toggleCollection(slug)}
                  type="checkbox"
                />
                {slug}
              </label>
            ))}
          </div>
        )}
      </div>

      <div className={`${SUBPANEL_CLASS} space-y-3`}>
        <span className={LABEL_CLASS}>Categorias</span>
        {categories.length === 0 ? (
          <p className={MUTED_TEXT_CLASS}>Nenhuma categoria cadastrada.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <label
                className="flex cursor-pointer items-center gap-2 border-2 border-[#1a1a1a]/20 bg-white px-3 py-2 text-xs font-black uppercase tracking-[0.12em] text-[#1a1a1a] has-checked:border-[#1a1a1a] has-checked:bg-brand-yellow"
                key={category.id}
              >
                <input
                  checked={targets.categories.includes(category.id)}
                  className="h-4 w-4 accent-[#1a1a1a]"
                  disabled={disabled}
                  onChange={() => toggleCategory(category.id)}
                  type="checkbox"
                />
                {category.name}
              </label>
            ))}
          </div>
        )}
      </div>

      <div className={`${SUBPANEL_CLASS} space-y-3`}>
        <span className={LABEL_CLASS}>Produtos</span>

        <div className="flex flex-wrap gap-2">
          <input
            aria-label="Buscar produto por nome"
            className={`${INPUT_CLASS} max-w-sm`}
            disabled={disabled}
            onChange={(event) => setSearch(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                void runSearch();
              }
            }}
            placeholder="Buscar produto"
            value={search}
          />
          <button
            className={COMPACT_BUTTON_CLASS}
            disabled={disabled || isSearching}
            onClick={() => void runSearch()}
            type="button"
          >
            <Search aria-hidden className="h-4 w-4" />
            {isSearching ? "Buscando..." : "Buscar"}
          </button>
        </div>

        {searchError === "" ? null : (
          <p className="text-sm font-semibold text-[#c0392b]">⚠ {searchError}</p>
        )}

        {results.length === 0 ? null : (
          <ul className="space-y-1">
            {results.map((product) => (
              <li className="flex items-center justify-between gap-2" key={product.id}>
                <span className="truncate text-sm text-[#231f20]">{product.name}</span>
                <button
                  aria-label={`Aplicar a ${product.name}`}
                  className={COMPACT_BUTTON_CLASS}
                  disabled={disabled || targets.products.includes(product.id)}
                  onClick={() => addProduct(product)}
                  type="button"
                >
                  <Plus aria-hidden className="h-4 w-4" />
                  Aplicar
                </button>
              </li>
            ))}
          </ul>
        )}

        {targets.products.length === 0 ? (
          <p className={MUTED_TEXT_CLASS}>Nenhum produto específico.</p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {targets.products.map((productId) => (
              <li
                className="flex items-center gap-2 border-2 border-[#1a1a1a] bg-white px-3 py-1.5 text-xs font-semibold text-[#1a1a1a]"
                key={productId}
              >
                {names[productId] ?? `Produto #${productId}`}
                <button
                  aria-label={`Remover ${names[productId] ?? `produto ${productId}`}`}
                  className="cursor-pointer text-[#c0392b] disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={disabled}
                  onClick={() =>
                    onChange({
                      ...targets,
                      products: targets.products.filter((item) => item !== productId),
                    })
                  }
                  type="button"
                >
                  <X aria-hidden className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
