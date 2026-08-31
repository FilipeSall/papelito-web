import { useEffect, useRef } from "react";
import Link from "next/link";

import type { VendorStockItem, VendorStockKit } from "@/features/vendor-stock/types/vendor-stock";

import {
  formatStockUpdatedAt,
  StockQtyField,
  StockStatusBadge,
  StockThumb,
  stockThumbFrameClassName,
} from "./stock-cells";

function KitItems({
  kit,
  onQtyChange,
  quantities,
  savingIds,
}: {
  kit: VendorStockKit;
  onQtyChange: (productId: number, qty: string) => void;
  quantities: Record<string, string>;
  savingIds: Set<number>;
}) {
  if (kit.items.length === 0) {
    return (
      <p className="border-2 border-dashed border-[#1a1a1a]/30 bg-white px-4 py-3 text-sm font-medium text-[#1a1a1a]/64">
        Este kit ainda não tem produtos cadastrados.
      </p>
    );
  }

  return (
    <ul className="ml-5 space-y-2 border-l-2 border-[#1a1a1a]/25 pl-5 sm:ml-7 sm:pl-6">
      {kit.items.map((kitItem) => (
        <li className="relative" key={kitItem.productId}>
          <span
            aria-hidden
            className="absolute top-1/2 -left-5 h-0.5 w-5 bg-[#1a1a1a]/25 sm:-left-6 sm:w-6"
          />
          <div className="flex flex-wrap items-center gap-3 rounded-[10px] border border-brand-dark/12 bg-white px-3 py-2">
            <span className={`${stockThumbFrameClassName} h-10 w-10`}>
              <StockThumb alt={kitItem.productName} sizes="40px" src={kitItem.imageUrl} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-[#1a1a1a]">{kitItem.productName}</p>
              <p className="mt-0.5 text-[11px] font-black uppercase tracking-[0.14em] text-[#1a1a1a]/52">
                {kitItem.sku || "Sem SKU"}
              </p>
            </div>
            <span
              className={`inline-flex items-center rounded-lg border px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] ${
                kitItem.isZeroed
                  ? "border-[#c0392b]/30 bg-[#f7e6e2] text-[#7a3428]"
                  : "border-brand-dark/20 bg-brand-yellow/30 text-brand-dark"
              }`}
            >
              {kitItem.quantity}x por kit
            </span>
            <StockQtyField
              onQtyChange={onQtyChange}
              productId={kitItem.productId}
              productName={kitItem.productName}
              qty={quantities[kitItem.productId] ?? String(kitItem.qty)}
              saving={savingIds.has(kitItem.productId)}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

/**
 * Linha de um kit no estoque do vendor: o kit como elemento pai e, subordinados
 * a ele, os produtos que o compõem.
 *
 * O kit não tem quantidade própria para ajustar — quantas vendas ele comporta é
 * consequência do estoque dos itens (`assemblableQty`). Editável aqui é o
 * estoque de cada item, pelo mesmo autosave das linhas de produto.
 *
 * Os itens vêm de `item.kit`, no mesmo payload da listagem — nunca de uma
 * consulta por kit.
 */
export function KitStockRow({
  columnCount,
  focused,
  item,
  kit,
  onQtyChange,
  quantities,
  savingIds,
}: {
  columnCount: number;
  focused: boolean;
  item: VendorStockItem;
  kit: VendorStockKit;
  onQtyChange: (productId: number, qty: string) => void;
  quantities: Record<string, string>;
  savingIds: Set<number>;
}) {
  const ref = useRef<HTMLTableRowElement>(null);
  const kitHref = kit.slug ? `/kits/${kit.slug}` : null;

  useEffect(() => {
    if (focused) ref.current?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [focused]);

  return (
    <>
      <tr className={focused ? "bg-brand-yellow/32" : "bg-brand-yellow/20"} data-testid="stock-kit-row" ref={ref}>
        <td className="border-l-4 border-[#1a1a1a] px-4 pt-4 pb-2">
          <div className="flex min-w-64 items-center gap-3">
            <span className={`${stockThumbFrameClassName} h-14 w-14`}>
              <StockThumb alt={item.productName} src={item.imageUrl} />
            </span>
            <div className="min-w-0">
              <span className="inline-flex items-center border-2 border-[#1a1a1a] bg-[#1a1a1a] px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.18em] text-brand-yellow">
                Kit
              </span>
              {kitHref ? (
                <Link
                  aria-label={`Abrir kit ${item.productName} em nova aba`}
                  className="mt-1 block text-sm font-black text-[#1a1a1a] transition hover:text-[#1a1a1a]/72"
                  href={kitHref}
                  rel="noreferrer"
                  target="_blank"
                >
                  {item.productName}
                </Link>
              ) : (
                <span className="mt-1 block text-sm font-black text-[#1a1a1a]">{item.productName}</span>
              )}
              <p className="mt-1 text-[11px] font-black uppercase tracking-[0.14em] text-[#1a1a1a]/52">
                {item.sku || "Sem SKU"}
              </p>
            </div>
          </div>
        </td>
        <td className="px-4 pt-4 pb-2 text-sm text-[#1a1a1a]/68">{formatStockUpdatedAt(item.updatedAt)}</td>
        <td className="px-4 pt-4 pb-2">
          <StockStatusBadge qty={kit.assemblableQty} />
        </td>
        <td className="px-4 pt-4 pb-2">
          <div className="flex flex-col items-end" data-testid="stock-kit-sellable">
            <span className="text-lg leading-none font-black text-[#1a1a1a]">{kit.assemblableQty}</span>
            <span className="mt-1 text-[10px] font-black uppercase tracking-[0.14em] text-[#1a1a1a]/58">
              {kit.assemblableQty === 1 ? "venda possível" : "vendas possíveis"}
            </span>
          </div>
        </td>
      </tr>
      <tr className={focused ? "bg-brand-yellow/32" : "bg-brand-yellow/20"}>
        <td
          className="border-b border-l-4 border-brand-dark/15 border-l-[#1a1a1a] px-4 pt-0 pb-4"
          colSpan={columnCount}
          data-testid="stock-kit-items"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#1a1a1a]/58">
              Itens do kit ({kit.items.length})
            </p>
            <p className="text-[10px] font-medium tracking-[0.02em] text-[#1a1a1a]/58">
              O kit não tem estoque próprio: ajuste os itens para mudar quantas vendas ele comporta.
            </p>
          </div>
          <KitItems
            kit={kit}
            onQtyChange={onQtyChange}
            quantities={quantities}
            savingIds={savingIds}
          />
        </td>
      </tr>
    </>
  );
}
