"use client";

import { Check, Plus } from "lucide-react";

import { FOCUS_RING } from "@/components/layout/admin-panel/primitives";
import type { VendorPackagingCatalogItem } from "@/features/vendor-packaging/types/vendor-packaging";

import { PackagingBoxGlyph, PackagingCustomGlyph } from "./packaging-glyphs";

function formatCm(valueMm: number): string {
  return String(valueMm / 10).replace(".", ",");
}

function dimensionsLabel(item: VendorPackagingCatalogItem): string {
  return `${formatCm(item.lengthMm)} × ${formatCm(item.widthMm)} × ${formatCm(item.heightMm)} cm`;
}

function payloadLabel(maxPayloadG: number | null): string {
  if (maxPayloadG === null) return "Sem limite de carga";
  return `Até ${String(maxPayloadG / 1000).replace(".", ",")} kg`;
}

function groupByCategory(
  catalog: VendorPackagingCatalogItem[],
): { category: string; items: VendorPackagingCatalogItem[] }[] {
  const groups: { category: string; items: VendorPackagingCatalogItem[] }[] = [];

  for (const item of catalog) {
    const found = groups.find((group) => group.category === item.category);
    if (found) {
      found.items.push(item);
      continue;
    }
    groups.push({ category: item.category, items: [item] });
  }

  return groups;
}

const CARD_BASE =
  "group relative flex flex-col items-start gap-3 border-2 border-[#1a1a1a] p-4 text-left transition disabled:cursor-not-allowed disabled:opacity-45";

function ModelCard({
  disabled,
  item,
  onPick,
  registered,
}: Readonly<{
  disabled: boolean;
  item: VendorPackagingCatalogItem;
  onPick: (code: string) => void;
  registered: boolean;
}>) {

  const surface = registered ? "bg-brand-yellow" : "bg-white hover:bg-[#faf8f2]";
  const state = registered ? ", já no seu catálogo" : "";

  return (
    <button
      aria-label={`${item.code}, ${dimensionsLabel(item)}, ${payloadLabel(item.maxPayloadG)}${state}`}
      className={[CARD_BASE, surface, FOCUS_RING].join(" ")}
      disabled={disabled}
      onClick={() => onPick(item.code)}
      type="button"
    >
      <div className="flex w-full items-start justify-between gap-2">
        <PackagingBoxGlyph
          className="h-14 w-14 shrink-0 text-[#1a1a1a]"
          heightMm={item.heightMm}
          lengthMm={item.lengthMm}
          widthMm={item.widthMm}
        />
        {registered ? (
          <span className="inline-flex items-center gap-1 border-2 border-[#1a1a1a] bg-[#1a1a1a] px-1.5 py-0.5 text-[9px] font-black tracking-[0.14em] text-brand-yellow uppercase">
            <Check aria-hidden className="h-3 w-3" strokeWidth={2.4} />
            No catálogo
          </span>
        ) : null}
      </div>
      <div className="min-w-0">
        <p
          className="font-mono text-sm font-bold tracking-[0.06em] text-[#1a1a1a]"
          data-numeric
        >
          {item.code}
        </p>
        <p className="mt-1 text-xs leading-5 font-semibold text-[#1a1a1a]" data-numeric>
          {dimensionsLabel(item)}
        </p>
        <p className="text-xs leading-5 text-[#4a5565]">{payloadLabel(item.maxPayloadG)}</p>
      </div>
    </button>
  );
}

/**
 * Grade dos 21 modelos RPC, agrupada pelas categorias que o WordPress devolve.
 *
 * A silhueta guarda a proporção real do modelo, então a fileira lê como uma estante: o vendor
 * reconhece o formato antes de ler a medida. Modelo já cadastrado aparece marcado e continua
 * clicável — ele abre a caixa existente para conferência, em vez de virar cadastro duplicado, e
 * por isso o teto de caixas ativas não o desabilita.
 */
export function PackagingModelGrid({
  atLimit,
  disabled,
  catalog,
  onPickCustom,
  onPickModel,
  registeredCodes,
}: Readonly<{
  /** Teto de caixas ativas atingido: fecha só o cadastro novo, nunca a conferência. */
  atLimit: boolean;
  catalog: VendorPackagingCatalogItem[];
  disabled: boolean;
  onPickCustom: () => void;
  onPickModel: (code: string) => void;
  registeredCodes: string[];
}>) {
  const groups = groupByCategory(catalog);

  return (
    <div className="space-y-6">
      <header>
        <div className="flex items-center gap-2">
          <span aria-hidden className="inline-block h-3 w-3 rotate-45 bg-brand-yellow" />
          <h2 className="text-[11px] font-black tracking-[0.22em] text-[#1a1a1a] uppercase">
            Modelos de caixa
          </h2>
        </div>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#4a5565]">
          Marque os modelos que sua loja já usa. Cada um abre para você conferir a medida interna
          antes de salvar.
        </p>
      </header>

      {groups.map((group) => (
        <section key={group.category}>
          <h3 className="text-[11px] font-black tracking-[0.22em] text-[#1a1a1a] uppercase">
            {group.category}
          </h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {group.items.map((item) => (
              <ModelCard
                disabled={disabled || (atLimit && !registeredCodes.includes(item.code))}
                item={item}
                key={item.code}
                onPick={onPickModel}
                registered={registeredCodes.includes(item.code)}
              />
            ))}
          </div>
        </section>
      ))}

      <section>
        <h3 className="text-[11px] font-black tracking-[0.22em] text-[#1a1a1a] uppercase">
          Fora do catálogo
        </h3>
        <button
          className={[
            "mt-3 flex w-full items-center gap-4 border-2 border-dashed border-[#1a1a1a] bg-white p-4 text-left transition hover:bg-[#faf8f2] disabled:cursor-not-allowed disabled:opacity-45",
            FOCUS_RING,
          ].join(" ")}
          disabled={disabled || atLimit}
          onClick={onPickCustom}
          type="button"
        >
          <PackagingCustomGlyph className="h-10 w-10 shrink-0 text-[#1a1a1a]" />
          <span className="min-w-0">
            <span className="flex items-center gap-1.5 text-[11px] font-black tracking-[0.18em] text-[#1a1a1a] uppercase">
              <Plus aria-hidden className="h-3.5 w-3.5" strokeWidth={2.4} />
              Cadastrar caixa própria
            </span>
            <span className="mt-1.5 block text-xs leading-5 text-[#4a5565]">
              Para a caixa que sua loja já usa e não está entre os modelos RPC.
            </span>
          </span>
        </button>
      </section>
    </div>
  );
}
