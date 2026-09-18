"use client";

import { Archive, Pencil, Ruler, RotateCcw, ShieldCheck, Trash2, Weight } from "lucide-react";

import { FOCUS_RING, StatusChip, type StatusShape } from "@/components/layout/admin-panel/primitives";
import { PACKAGING_MAX_ACTIVE_PROFILES } from "@/features/vendor-packaging/utils/packaging-readiness";
import type { VendorPackagingProfile } from "@/features/vendor-packaging/types/vendor-packaging";

import { PackagingBoxGlyph } from "./packaging-glyphs";

function formatCm(valueMm: number): string {
  return String(valueMm / 10).replace(".", ",");
}

function formatKg(valueG: number): string {
  return String(valueG / 1000).replace(".", ",");
}

function dimensionsLabel(item: VendorPackagingProfile): string {
  return `${formatCm(item.lengthMm)} × ${formatCm(item.widthMm)} × ${formatCm(item.heightMm)} cm`;
}

function loadLabel(item: VendorPackagingProfile): string {
  const carga = item.maxPayloadG === null ? "sem limite" : `${formatKg(item.maxPayloadG)} kg`;
  const tara = item.tareWeightG === 0 ? "não informada" : `${formatKg(item.tareWeightG)} kg`;
  return `Tara ${tara} · Carga ${carga}`;
}

/**
 * Situação da caixa como chip de ícone mais texto.
 *
 * Os dois tons pendentes nomeiam dívidas diferentes. "Tara pendente" vem primeiro porque é a que
 * custa dinheiro: sem o peso da embalagem vazia o frete sai sub-declarado. "Medida do catálogo"
 * diz que a caixa ainda carrega o número nominal do modelo, nunca comparado com a caixa real.
 */
export function packagingProfileShape(item: VendorPackagingProfile): StatusShape {
  if (!item.active) {
    return { icon: Archive, label: "Inativa", tone: "neutral" };
  }

  if (item.tareWeightG === 0) {
    return { icon: Weight, label: "Tara pendente", tone: "pending" };
  }

  if (item.source === "rpc" && item.version === 1) {
    return { icon: Ruler, label: "Medida do catálogo", tone: "pending" };
  }

  return { icon: ShieldCheck, label: "Ativa", tone: "positive" };
}

const ACTION_CLASS =
  "inline-flex h-10 items-center gap-1.5 border-2 border-[#1a1a1a] bg-white px-3 text-[10px] font-black tracking-[0.14em] text-[#1a1a1a] uppercase transition hover:bg-[#1a1a1a] hover:text-brand-yellow disabled:cursor-not-allowed disabled:opacity-40";

const DESTRUCTIVE_CLASS =
  "inline-flex h-10 items-center gap-1.5 border-2 border-[#1a1a1a] bg-white px-3 text-[10px] font-black tracking-[0.14em] text-[#c0392b] uppercase transition hover:bg-[#c0392b] hover:border-[#c0392b] hover:text-white disabled:cursor-not-allowed disabled:opacity-40";

function ShelfRow({
  item,
  onDeactivate,
  onDelete,
  onEdit,
  onReactivate,
  pending,
}: Readonly<{
  item: VendorPackagingProfile;
  onDeactivate: (item: VendorPackagingProfile) => void;
  onDelete: (item: VendorPackagingProfile) => void;
  onEdit: (item: VendorPackagingProfile) => void;
  onReactivate: (item: VendorPackagingProfile) => void;
  pending: boolean;
}>) {
  const shape = packagingProfileShape(item);

  return (
    <li className="bg-[#faf8f2] px-5 py-4 transition hover:bg-white">
      <div className="flex items-start gap-3">
        <PackagingBoxGlyph
          className="h-12 w-12 shrink-0 text-[#1a1a1a]"
          heightMm={item.heightMm}
          lengthMm={item.lengthMm}
          widthMm={item.widthMm}
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-black text-[#1a1a1a]">{item.label}</p>
          <p className="mt-1 font-mono text-[11px] font-bold text-[#4a5565]" data-numeric>
            {item.code} · v{item.version}
          </p>
          <p className="mt-1.5 text-xs leading-5 text-[#1a1a1a]" data-numeric>
            {dimensionsLabel(item)}
          </p>
          <p className="text-xs leading-5 text-[#4a5565]" data-numeric>
            {loadLabel(item)}
          </p>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <StatusChip compact icon={shape.icon} label={shape.label} tone={shape.tone} />
        {item.active ? (
          <>
            <button
              className={[ACTION_CLASS, FOCUS_RING].join(" ")}
              disabled={pending}
              onClick={() => onEdit(item)}
              type="button"
            >
              <Pencil aria-hidden className="h-3.5 w-3.5" strokeWidth={2.4} />
              Conferir
            </button>
            <button
              className={[DESTRUCTIVE_CLASS, FOCUS_RING].join(" ")}
              disabled={pending}
              onClick={() => onDeactivate(item)}
              type="button"
            >
              Desativar
            </button>
          </>
        ) : (
          <>
            <button
              className={[ACTION_CLASS, FOCUS_RING].join(" ")}
              disabled={pending}
              onClick={() => onReactivate(item)}
              type="button"
            >
              <RotateCcw aria-hidden className="h-3.5 w-3.5" strokeWidth={2.4} />
              Reativar
            </button>
            <button
              className={[DESTRUCTIVE_CLASS, FOCUS_RING].join(" ")}
              disabled={pending}
              onClick={() => onDelete(item)}
              type="button"
            >
              <Trash2 aria-hidden className="h-3.5 w-3.5" strokeWidth={2.4} />
              Excluir
            </button>
          </>
        )}
      </div>
    </li>
  );
}

/**
 * Coluna das caixas que o vendor já escolheu, ativas acima e desativadas abaixo.
 *
 * As inativas continuam visíveis porque desativar preserva a linha e o histórico: escondê-las
 * faria o vendor cadastrar de novo um código que o WordPress vai recusar como duplicado. Só elas
 * oferecem exclusão definitiva — a caixa em uso sai de cena desativando, nunca apagando.
 */
export function PackagingShelf({
  items,
  onDeactivate,
  onDelete,
  onEdit,
  onReactivate,
  pending,
}: Readonly<{
  items: VendorPackagingProfile[];
  onDeactivate: (item: VendorPackagingProfile) => void;
  onDelete: (item: VendorPackagingProfile) => void;
  onEdit: (item: VendorPackagingProfile) => void;
  onReactivate: (item: VendorPackagingProfile) => void;
  pending: boolean;
}>) {
  const active = items.filter((item) => item.active);
  const inactive = items.filter((item) => !item.active);
  const summary = `${active.length} de ${PACKAGING_MAX_ACTIVE_PROFILES} caixas ativas`;

  return (
    <section className="border-2 border-[#1a1a1a] bg-[#faf8f2] shadow-[8px_8px_0px_#1a1a1a]">
      <div aria-hidden className="h-2 w-full bg-brand-yellow" />
      <div className="border-b-2 border-[#1a1a1a] px-5 py-3">
        <p className="text-[10px] font-black tracking-[0.22em] text-[#231f20]/55 uppercase">
          {summary}
        </p>
      </div>

      {active.length === 0 ? (
        <div className="px-5 py-8">
          <div className="border-2 border-dashed border-[#1a1a1a] bg-white px-4 py-8 text-center">
            <p className="text-[11px] font-black tracking-[0.18em] text-[#1a1a1a] uppercase">
              Nenhuma caixa ativa
            </p>
            <p className="mt-2 text-xs leading-5 text-[#4a5565]">
              Escolha um modelo da grade para começar.
            </p>
          </div>
        </div>
      ) : (
        <ul className="divide-y-2 divide-[#1a1a1a]/10">
          {active.map((item) => (
            <ShelfRow
              item={item}
              key={item.id}
              onDeactivate={onDeactivate}
              onDelete={onDelete}
              onEdit={onEdit}
              onReactivate={onReactivate}
              pending={pending}
            />
          ))}
        </ul>
      )}

      {inactive.length > 0 ? (
        <>
          <div className="border-y-2 border-[#1a1a1a] bg-[#f7f2e7] px-5 py-3">
            <p className="text-[10px] font-black tracking-[0.22em] text-[#231f20]/55 uppercase">
              Desativadas
            </p>
          </div>
          <ul className="divide-y-2 divide-[#1a1a1a]/10">
            {inactive.map((item) => (
              <ShelfRow
                item={item}
                key={item.id}
                onDeactivate={onDeactivate}
                onDelete={onDelete}
                onEdit={onEdit}
                onReactivate={onReactivate}
                pending={pending}
              />
            ))}
          </ul>
        </>
      ) : null}
    </section>
  );
}
