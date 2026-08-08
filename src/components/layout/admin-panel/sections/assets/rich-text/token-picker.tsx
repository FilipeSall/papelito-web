"use client";

import { useMemo, useState } from "react";

import { listTokenDefinitions, type RichTextProductFact } from "@/features/rich-text";

import { INPUT_CLASS, SECONDARY_BUTTON_CLASS } from "../field-classes";

type TokenPickerProps = {
  onCancel: () => void;
  onSelect: (token: string, params?: Record<string, string>) => void;
  promotionProducts: RichTextProductFact[];
};

export function TokenPicker({ onCancel, onSelect, promotionProducts }: TokenPickerProps) {
  const [pendingProductToken, setPendingProductToken] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const groups = useMemo(() => {
    const byGroup = new Map<string, ReturnType<typeof listTokenDefinitions>>();

    for (const definition of listTokenDefinitions()) {
      byGroup.set(definition.group, [...(byGroup.get(definition.group) ?? []), definition]);
    }

    return Array.from(byGroup.entries());
  }, []);

  const matchingProducts = useMemo(() => {
    const term = search.trim().toLowerCase();
    return term === ""
      ? promotionProducts
      : promotionProducts.filter((product) => product.name.toLowerCase().includes(term));
  }, [promotionProducts, search]);

  if (pendingProductToken) {
    return (
      <div className="mt-2 rounded-xl border border-[#231f20]/12 bg-white p-3">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#6a5f00]">
            Escolha o produto
          </p>
          <button className={SECONDARY_BUTTON_CLASS} onClick={onCancel} type="button">
            Cancelar
          </button>
        </div>

        <input
          aria-label="Buscar produto em promoção"
          className={INPUT_CLASS}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar produto em promoção"
          type="search"
          value={search}
        />

        {promotionProducts.length === 0 ? (
          <p className="mt-2 text-xs text-[#5e574c]">
            Nenhuma campanha ativa no momento. Só é possível inserir produtos que estejam em promoção.
          </p>
        ) : (
          <ul className="mt-2 max-h-48 space-y-1 overflow-y-auto">
            {matchingProducts.map((product) => (
              <li key={product.productId}>
                <button
                  className="w-full rounded-lg px-2 py-1.5 text-left text-sm text-[#1e1c10] hover:bg-[#fff9ea]"
                  onClick={() =>
                    onSelect(pendingProductToken, { productId: String(product.productId) })
                  }
                  type="button"
                >
                  {product.name}
                </button>
              </li>
            ))}
            {matchingProducts.length === 0 ? (
              <li className="px-2 py-1.5 text-xs text-[#5e574c]">Nenhum produto encontrado.</li>
            ) : null}
          </ul>
        )}
      </div>
    );
  }

  return (
    <div className="mt-2 rounded-xl border border-[#231f20]/12 bg-white p-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#6a5f00]">
          Inserir dado dinâmico
        </p>
        <button className={SECONDARY_BUTTON_CLASS} onClick={onCancel} type="button">
          Fechar
        </button>
      </div>

      <div className="mt-2 max-h-64 space-y-3 overflow-y-auto">
        {groups.map(([group, definitions]) => (
          <div key={group}>
            <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#8a8368]">
              {group}
            </p>
            <ul className="mt-1 space-y-1">
              {definitions.map((definition) => (
                <li key={definition.id}>
                  <button
                    className="w-full rounded-lg px-2 py-1.5 text-left hover:bg-[#fff9ea]"
                    onClick={() =>
                      definition.paramKind === "promotion-product"
                        ? setPendingProductToken(definition.id)
                        : onSelect(definition.id)
                    }
                    type="button"
                  >
                    <span className="block text-sm text-[#1e1c10]">
                      {definition.label}
                      {definition.paramKind === "promotion-product" ? "…" : ""}
                    </span>
                    <span className="block text-xs text-[#5e574c]">{definition.description}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
