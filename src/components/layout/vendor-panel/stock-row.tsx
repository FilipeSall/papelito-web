import { useEffect, useRef } from "react";
import Link from "next/link";

import { ImageWithSkeleton, ProductImageFallback } from "@/components/ui";
import type { VendorStockItem } from "@/features/vendor-stock/types/vendor-stock";

export function StockRow({
  focused,
  item,
  onQtyChange,
  qty,
  saving,
  save,
}: {
  focused: boolean;
  item: VendorStockItem;
  onQtyChange: (productId: number, qty: string) => void;
  qty: string;
  saving: boolean;
  save: (item: VendorStockItem) => Promise<void>;
}) {
  const ref = useRef<HTMLTableRowElement>(null);
  const productHref = `/produtos/${item.productId}`;

  useEffect(() => {
    if (focused) ref.current?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [focused]);

  return (
    <tr className={focused ? "bg-brand-yellow/18" : ""} ref={ref}>
      <td className="border-b border-brand-dark/8 px-4 py-3">
        <div className="flex min-w-64 items-center gap-3">
          <Link
            aria-label={`Abrir produto ${item.productName} em nova aba`}
            className="relative h-14 w-14 shrink-0 overflow-hidden rounded-[14px] border border-brand-dark/10 bg-white p-1 transition hover:-translate-y-0.5 hover:shadow-[4px_4px_0_rgba(35,31,32,0.10)]"
            href={productHref}
            rel="noreferrer"
            target="_blank"
          >
            {item.imageUrl ? (
              <ImageWithSkeleton
                alt={item.productName}
                fallback={<ProductImageFallback className="h-full w-full" />}
                imageClassName="object-contain"
                sizes="56px"
                src={item.imageUrl}
              />
            ) : (
              <ProductImageFallback className="h-full w-full" />
            )}
          </Link>
          <div className="min-w-0">
            <Link
              className="block text-sm font-semibold text-brand-dark transition hover:text-brand-dark/70"
              href={productHref}
              rel="noreferrer"
              target="_blank"
            >
              {item.productName}
            </Link>
            <p className="text-xs text-brand-dark/48">{item.sku || "Sem SKU"}</p>
          </div>
        </div>
      </td>
      <td className="border-b border-brand-dark/8 px-4 py-3 text-sm text-brand-dark/68">
        {item.updatedAt || "Sem ajuste"}
      </td>
      <td className="border-b border-brand-dark/8 px-4 py-3">
        <span
          className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${
            item.qty === 0 ? "bg-[#f3e3df] text-[#7a3428]" : "bg-[#e4efe0] text-[#28422d]"
          }`}
        >
          {item.qty === 0 ? "Zerado" : "Disponivel"}
        </span>
      </td>
      <td className="border-b border-brand-dark/8 px-4 py-3">
        <div className="flex items-center justify-end gap-2">
          <input
            aria-label={`Quantidade de ${item.productName}`}
            className="h-10 w-20 rounded-[10px] border border-brand-dark/16 bg-white px-3 text-right text-sm outline-none focus:border-brand-dark"
            min={0}
            onChange={(event) => onQtyChange(item.productId, event.target.value)}
            type="number"
            value={qty}
          />
          <button
            className="h-10 rounded-[10px] bg-brand-dark px-4 text-xs font-semibold uppercase tracking-[0.14em] text-brand-yellow disabled:opacity-45"
            disabled={saving || qty === String(item.qty)}
            onClick={() => void save(item)}
            type="button"
          >
            {saving ? "Salvando" : "Salvar"}
          </button>
        </div>
      </td>
    </tr>
  );
}
