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
    <tr className={focused ? "bg-brand-yellow/22" : "bg-[#faf8f2]"} ref={ref}>
      <td className="border-b-2 border-[#1a1a1a] px-4 py-3">
        <div className="flex min-w-64 items-center gap-3">
          <Link
            aria-label={`Abrir produto ${item.productName} em nova aba`}
            className="relative h-14 w-14 shrink-0 overflow-hidden border-2 border-[#1a1a1a] bg-white p-1 transition hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_#1a1a1a] focus-visible:outline-2 focus-visible:outline-brand-yellow focus-visible:outline-offset-2"
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
              className="block text-sm font-semibold text-[#1a1a1a] transition hover:text-[#1a1a1a]/72"
              href={productHref}
              rel="noreferrer"
              target="_blank"
            >
              {item.productName}
            </Link>
            <p className="mt-1 text-[11px] font-black uppercase tracking-[0.14em] text-[#1a1a1a]/52">
              {item.sku || "Sem SKU"}
            </p>
            {item.categories.length > 0 || item.tags.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-1.5" data-testid="stock-row-terms">
                {[...item.categories, ...item.tags].map((term) => (
                  <span
                    className="inline-flex items-center border-2 border-[#1a1a1a] bg-white px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.12em] text-[#1a1a1a]/72"
                    key={`${term.slug}-${term.id}`}
                  >
                    {term.name}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </td>
      <td className="border-b-2 border-[#1a1a1a] px-4 py-3 text-sm text-[#1a1a1a]/68">
        {item.updatedAt || "Sem ajuste"}
      </td>
      <td className="border-b-2 border-[#1a1a1a] px-4 py-3">
        <span
          className={`inline-flex min-h-8 items-center justify-center border-2 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] ${
            item.qty === 0
              ? "border-[#c0392b] bg-[#f7e6e2] text-[#7a3428]"
              : "border-[#1a1a1a] bg-[#1a1a1a] text-brand-yellow"
          }`}
        >
          {item.qty === 0 ? "Zerado" : "Disponivel"}
        </span>
      </td>
      <td className="border-b-2 border-[#1a1a1a] px-4 py-3">
        <div className="flex items-center justify-end gap-2">
          <input
            aria-label={`Quantidade de ${item.productName}`}
            className="h-10 w-20 border-2 border-[#1a1a1a] bg-white px-3 text-right text-sm text-[#1a1a1a] outline-none focus-visible:outline-2 focus-visible:outline-brand-yellow focus-visible:outline-offset-2"
            min={0}
            onChange={(event) => onQtyChange(item.productId, event.target.value)}
            onFocus={(event) => event.currentTarget.select()}
            type="number"
            value={qty}
          />
          <button
            className="inline-flex h-10 items-center justify-center border-2 border-[#1a1a1a] bg-[#1a1a1a] px-4 text-[11px] font-black uppercase tracking-[0.18em] text-brand-yellow shadow-[3px_3px_0px_#ffe500] transition hover:shadow-[1px_1px_0px_#ffe500] active:shadow-none focus-visible:outline-2 focus-visible:outline-brand-yellow focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-45"
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
