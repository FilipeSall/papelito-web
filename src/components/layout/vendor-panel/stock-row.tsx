import { useEffect, useRef } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";

import { ImageWithSkeleton, ProductImageFallback } from "@/components/ui";
import type { VendorStockItem } from "@/features/vendor-stock/types/vendor-stock";

export function StockRow({
  focused,
  item,
  onQtyChange,
  qty,
  saving,
}: {
  focused: boolean;
  item: VendorStockItem;
  onQtyChange: (productId: number, qty: string) => void;
  qty: string;
  saving: boolean;
}) {
  const ref = useRef<HTMLTableRowElement>(null);
  const productHref = `/produtos/${item.productId}`;

  useEffect(() => {
    if (focused) ref.current?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [focused]);

  return (
    <tr className={focused ? "bg-brand-yellow/22" : "bg-[#faf8f2]"} ref={ref}>
      <td className="border-b border-brand-dark/15 px-4 py-3">
        <div className="flex min-w-64 items-center gap-3">
          <Link
            aria-label={`Abrir produto ${item.productName} em nova aba`}
            className="relative h-14 w-14 shrink-0 overflow-hidden rounded-[10px] border border-brand-dark/12 bg-white p-1 transition hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(26,26,26,0.12)] focus-visible:outline-2 focus-visible:outline-brand-yellow focus-visible:outline-offset-2"
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
                    className="inline-flex items-center rounded-lg border border-brand-dark/12 bg-white px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.12em] text-brand-dark/64"
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
      <td className="border-b border-brand-dark/15 px-4 py-3 text-sm text-[#1a1a1a]/68">
        {item.updatedAt || "Sem ajuste"}
      </td>
      <td className="border-b border-brand-dark/15 px-4 py-3">
        <span
          className={`inline-flex min-h-8 items-center justify-center rounded-lg border px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] ${
            item.qty === 0
              ? "border-[#c0392b]/30 bg-[#f7e6e2] text-[#7a3428]"
              : "border-brand-dark bg-brand-dark text-brand-yellow"
          }`}
        >
          {item.qty === 0 ? "Zerado" : "Disponivel"}
        </span>
      </td>
      <td className="border-b border-brand-dark/15 px-4 py-3">
        <div className="flex items-center justify-end gap-2">
          <span aria-hidden={!saving} className="flex h-4 w-4 shrink-0 items-center justify-center">
            {saving ? (
              <Loader2 aria-label="Salvando" className="h-4 w-4 animate-spin text-[#1a1a1a]/60" strokeWidth={2} />
            ) : null}
          </span>
          <input
            aria-label={`Quantidade de ${item.productName}`}
            className="h-10 w-20 rounded-[10px] border border-brand-dark/15 bg-white px-3 text-right text-sm text-brand-dark outline-none focus-visible:outline-2 focus-visible:outline-brand-yellow focus-visible:outline-offset-2"
            min={0}
            onChange={(event) => onQtyChange(item.productId, event.target.value)}
            onFocus={(event) => event.currentTarget.select()}
            type="number"
            value={qty}
          />
        </div>
      </td>
    </tr>
  );
}
