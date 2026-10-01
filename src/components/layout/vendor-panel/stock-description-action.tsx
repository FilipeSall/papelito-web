import { PrimaryButton } from "@/components/layout/operational-panel";
import type { VendorStockItem } from "@/features/vendor-stock/types/vendor-stock";

interface StockDescriptionActionProps {
  /** Linha de estoque; a edição usa sempre o ID público normalizado. */
  item: VendorStockItem;
  /** Abre o editor do produto selecionado. */
  onEdit?: (item: VendorStockItem) => void;
}

/** Ação de conteúdo independente do saldo e da completude comercial do produto. */
export function StockDescriptionAction({ item, onEdit }: Readonly<StockDescriptionActionProps>) {
  if (!onEdit) return null;
  return (
    <div className="mt-2 space-y-1">
      {item.hasDescriptionOverride ? <p className="text-xs font-semibold">Descrição personalizada</p> : null}
      <PrimaryButton disabled={item.hasDescriptionOverride === null} onClick={() => onEdit(item)}>
        Editar descrição
      </PrimaryButton>
      {item.hasDescriptionOverride === null ? <p className="text-xs">Personalização indisponível no momento.</p> : null}
    </div>
  );
}
