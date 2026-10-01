import { PencilLine } from "lucide-react";

import { FOCUS_RING } from "@/components/layout/operational-panel";
import type { VendorStockItem } from "@/features/vendor-stock/types/vendor-stock";

interface StockDescriptionActionProps {
  /** Linha de estoque; a edição usa sempre o ID público normalizado. */
  item: VendorStockItem;
  /** Abre o editor do produto selecionado. */
  onEdit?: (item: VendorStockItem) => void;
}

/**
 * Lápis que abre o editor de descrição, ao lado do nome do produto.
 * Independe do saldo e da completude comercial; quando a personalização não
 * pode ser consultada, continua focável e explica o motivo na dica.
 */
export function StockDescriptionAction({ item, onEdit }: Readonly<StockDescriptionActionProps>) {
  if (!onEdit) return null;
  const unavailable = item.hasDescriptionOverride === null;
  const hint = unavailable ? "Personalização indisponível no momento" : "Editar descrição";

  return (
    <span className="group/description relative -my-1.5 -mr-1 inline-flex shrink-0">
      <button
        aria-disabled={unavailable || undefined}
        aria-label={unavailable ? `${hint}: ${item.productName}` : `Editar descrição de ${item.productName}`}
        className={[
          "inline-flex size-9 cursor-pointer items-center justify-center border-2 border-transparent text-[#1a1a1a]/58 transition",
          unavailable
            ? "cursor-not-allowed opacity-40"
            : "hover:border-[#1a1a1a] hover:bg-brand-yellow hover:text-[#1a1a1a] active:translate-y-px",
          FOCUS_RING,
        ].join(" ")}
        onClick={unavailable ? undefined : () => onEdit(item)}
        type="button"
      >
        <PencilLine aria-hidden className="size-4" strokeWidth={2.4} />
      </button>
      <span
        aria-hidden
        className="pointer-events-none absolute right-0 bottom-full z-30 mb-1.5 w-max max-w-52 bg-[#1a1a1a] px-2.5 py-1.5 text-[11px] font-bold leading-4 text-white opacity-0 shadow-[0_8px_18px_rgba(26,26,26,0.22)] transition-opacity delay-150 group-has-focus-visible/description:opacity-100 group-hover/description:opacity-100"
      >
        {hint}
      </span>
    </span>
  );
}

/** Tag da linha que indica que a loja mostra o texto do vendor no lugar do da Papelito. */
export function StockDescriptionMarker({ item }: Readonly<Pick<StockDescriptionActionProps, "item">>) {
  if (!item.hasDescriptionOverride) return null;
  return (
    <span className="inline-flex items-center gap-1 rounded-lg border border-brand-dark/12 bg-white px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.12em] text-brand-dark/64">
      <PencilLine aria-hidden className="size-3" strokeWidth={2.4} />
      Descrição personalizada
    </span>
  );
}
