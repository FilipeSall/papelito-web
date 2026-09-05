"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { Layers, Loader2, X } from "lucide-react";

import { FOCUS_RING } from "@/components/layout/operational-panel";

/**
 * Barra contextual da seleção múltipla.
 *
 * Aparece colada ao rodapé da janela porque a seleção acontece rolando uma lista longa: no topo
 * do painel a ação sairia de vista justamente quando o vendor termina de escolher.
 *
 * A confirmação diz o número de itens antes de escrever. Aplicar saldo a 20 produtos é
 * destrutivo — sobrescreve o que já havia —, e o número é a única defesa contra o clique errado.
 */
export function StockSelectionBar({
  onApply,
  onClear,
  saving,
  selectedCount,
}: {
  onApply: (qty: number) => void;
  onClear: () => void;
  saving: boolean;
  selectedCount: number;
}) {
  const [value, setValue] = useState("");
  const parsed = Number(value);
  const valid = value.trim() !== "" && Number.isInteger(parsed) && parsed >= 0;

  // `document` não existe no render do servidor. Hoje o early return acima
  // salva por acaso — a seleção nasce vazia —, mas qualquer seleção hidratada
  // de URL ou props derrubaria a página de estoque com 500.
  if (selectedCount === 0 || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-40 flex justify-center px-4 lg:left-72">
      <form
        className="pointer-events-auto flex w-full max-w-3xl flex-col gap-3 border-2 border-[#1a1a1a] bg-[#1a1a1a] px-4 py-3 shadow-[8px_8px_0px_#ffe500] sm:flex-row sm:items-center"
        onSubmit={(event) => {
          event.preventDefault();
          if (valid && !saving) onApply(parsed);
        }}
      >
        <p className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.16em] text-brand-yellow">
          <Layers aria-hidden className="h-4 w-4 shrink-0" strokeWidth={2.4} />
          {selectedCount} {selectedCount === 1 ? "produto" : "produtos"}
        </p>

        <div className="flex flex-1 items-center gap-2">
          <label
            className="text-[10px] font-black uppercase tracking-[0.16em] text-white/70"
            htmlFor="stock-bulk-qty"
          >
            Definir estoque
          </label>
          <input
            className={[
              "h-10 w-24 border-2 border-brand-yellow bg-white px-3 text-right text-sm tabular-nums font-bold text-[#1a1a1a] outline-none",
              FOCUS_RING,
            ].join(" ")}
            id="stock-bulk-qty"
            min={0}
            onChange={(event) => setValue(event.target.value)}
            placeholder="0"
            type="number"
            value={value}
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            className={[
              "inline-flex h-10 items-center gap-2 border-2 border-brand-yellow bg-brand-yellow px-4 text-[11px] font-black uppercase tracking-[0.16em] text-[#1a1a1a] transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-45",
              FOCUS_RING,
            ].join(" ")}
            disabled={!valid || saving}
            type="submit"
          >
            {saving ? (
              <Loader2 aria-hidden className="h-4 w-4 animate-spin" strokeWidth={2.4} />
            ) : null}
            {saving
              ? "Aplicando…"
              : `Aplicar a ${selectedCount} ${selectedCount === 1 ? "item" : "itens"}`}
          </button>
          <button
            aria-label="Limpar seleção"
            className={[
              "inline-flex h-10 w-10 items-center justify-center border-2 border-white/40 text-white transition hover:border-white",
              FOCUS_RING,
            ].join(" ")}
            onClick={onClear}
            type="button"
          >
            <X aria-hidden className="h-4 w-4" strokeWidth={2.4} />
          </button>
        </div>
      </form>
    </div>,
    document.body,
  );
}
