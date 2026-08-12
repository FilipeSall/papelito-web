"use client";

import { useState } from "react";
import { X } from "lucide-react";

import { CheckoutCustomSelect } from "@/components/layout/checkout-page/checkout-custom-select";
import type { AdminSubcategory } from "@/lib/server/admin-taxonomy";

export type SubcategoryFormValues = {
  facet: string;
  isActive?: boolean;
  name: string;
  slug?: string;
};

/**
 * A faceta é o eixo de classificação, e é ela que faz o multivalor ter sentido:
 * uma seda pode ser Brown (material) e Slim (formato) ao mesmo tempo. Sem faceta,
 * a lista de subcategorias vira um amontoado.
 */
const FACET_OPTIONS = [
  { label: "Tipo", value: "tipo" },
  { label: "Material", value: "material" },
  { label: "Formato", value: "formato" },
  { label: "Tamanho", value: "tamanho" },
  { label: "Linha", value: "linha" },
  { label: "Geral", value: "geral" },
];

export function SubcategoryEditorModal({
  categoryName,
  subcategory,
  isSaving,
  onClose,
  onSave,
}: {
  categoryName: string;
  subcategory?: AdminSubcategory | null;
  isSaving: boolean;
  onClose: () => void;
  onSave: (values: SubcategoryFormValues) => void;
}) {
  const [name, setName] = useState(subcategory?.name ?? "");
  const [slug, setSlug] = useState(subcategory?.slug ?? "");
  const [facet, setFacet] = useState(subcategory?.facet ?? "tipo");
  const [isActive, setIsActive] = useState(subcategory?.isActive ?? true);
  const [error, setError] = useState("");

  function handleSubmit() {
    if (!name.trim()) {
      setError("Informe o nome da subcategoria.");
      return;
    }

    setError("");
    onSave({ facet, isActive, name: name.trim(), ...(slug.trim() ? { slug: slug.trim() } : {}) });
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[#231f20]/70 p-4">
      <div className="w-full max-w-md border-2 border-[#1a1a1a] bg-[#faf8f2] shadow-[8px_8px_0px_#1a1a1a]">
        <div className="h-2 w-full bg-brand-yellow" />
        <div className="flex items-center justify-between gap-4 border-b-2 border-[#1a1a1a] p-5">
          <h3 className="text-sm font-black uppercase tracking-[0.18em] text-[#1a1a1a]">
            {subcategory ? "Editar" : "Nova"} subcategoria em {categoryName}
          </h3>
          <button
            aria-label="Fechar"
            className="border-2 border-[#1a1a1a] bg-white p-1.5 text-[#1a1a1a] transition hover:bg-brand-yellow"
            onClick={onClose}
            type="button"
          >
            <X aria-hidden className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 p-5">
          <label className="grid gap-2">
            <span className="text-[10px] font-black uppercase tracking-[0.18em] text-[#1a1a1a]">
              Nome *
            </span>
            <input
              className="h-11 w-full border-2 border-[#1a1a1a] bg-white px-3 text-sm text-[#1a1a1a] outline-none transition focus:outline-2 focus:outline-brand-yellow"
              onChange={(event) => setName(event.target.value)}
              type="text"
              value={name}
            />
          </label>

          <label className="grid gap-2">
            <span className="text-[10px] font-black uppercase tracking-[0.18em] text-[#1a1a1a]">
              Slug
            </span>
            <input
              className="h-11 w-full border-2 border-[#1a1a1a] bg-white px-3 text-sm text-[#1a1a1a] outline-none transition focus:outline-2 focus:outline-brand-yellow"
              onChange={(event) => setSlug(event.target.value)}
              placeholder="derivado do nome"
              type="text"
              value={slug}
            />
            <span className="text-[11px] font-semibold text-[#231f20]/60">
              O slug é único dentro da categoria — o mesmo &quot;slim&quot; pode existir em
              Sedas, Piteiras e Filtros.
            </span>
          </label>

          <CheckoutCustomSelect
            iconClassName="text-[#1a1a1a]"
            label="Faceta"
            labelClassName="block text-[10px] font-black uppercase leading-none tracking-[0.18em] text-[#1a1a1a]"
            listClassName="z-[90] border-2 border-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a]"
            onChange={setFacet}
            optionClassName="tracking-normal"
            options={FACET_OPTIONS}
            placeholder="Selecione a faceta"
            selectedValueClassName="text-[#1a1a1a]"
            triggerClassName="h-11 w-full rounded-none !border-2 !border-[#1a1a1a] bg-white px-3 text-sm tracking-normal text-[#1a1a1a] focus:!border-[#1a1a1a]"
            value={facet}
          />

          <label className="flex items-center gap-2 text-sm font-semibold text-[#1a1a1a]">
            <input checked={isActive} onChange={(event) => setIsActive(event.target.checked)} type="checkbox" />
            Subcategoria ativa
          </label>

          {error ? (
            <p className="text-sm font-semibold text-[#c0392b]">⚠ {error}</p>
          ) : null}
        </div>

        <div className="flex justify-end gap-3 border-t-2 border-[#1a1a1a] p-5">
          <button
            className="border-2 border-[#1a1a1a] bg-white px-5 py-3 text-[11px] font-black uppercase tracking-[0.18em] text-[#1a1a1a] transition hover:bg-brand-yellow"
            onClick={onClose}
            type="button"
          >
            Cancelar
          </button>
          <button
            className="border-2 border-[#1a1a1a] bg-[#1a1a1a] px-5 py-3 text-[11px] font-black uppercase tracking-[0.18em] text-[#ffe500] shadow-[3px_3px_0px_#ffe500] transition hover:shadow-[1px_1px_0px_#ffe500] active:shadow-none disabled:opacity-50"
            disabled={isSaving}
            onClick={handleSubmit}
            type="button"
          >
            {isSaving ? "Salvando…" : subcategory ? "Salvar" : "Criar"}
          </button>
        </div>
      </div>
    </div>
  );
}
