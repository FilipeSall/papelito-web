import { useEffect, useRef } from "react";
import Link from "next/link";

import type { VendorStockItem } from "@/features/vendor-stock/types/vendor-stock";

import {
  formatStockUpdatedAt,
  StockQtyField,
  StockStatusBadge,
  StockThumb,
  stockThumbFrameClassName,
} from "./stock-cells";

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
  const productHref = `/produtos/${item.publicProductId || item.productId}`;
  const isPublic = item.isPubliclyViewable;

  useEffect(() => {
    if (focused) ref.current?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [focused]);

  return (
    <tr className={focused ? "bg-brand-yellow/22" : "bg-[#faf8f2]"} ref={ref}>
      <td className="border-b border-brand-dark/15 px-4 py-3">
        <div className="flex min-w-64 items-center gap-3">
          {isPublic ? (
            <Link
              aria-label={`Abrir produto ${item.productName} em nova aba`}
              className={`${stockThumbFrameClassName} h-14 w-14 transition hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(26,26,26,0.12)] focus-visible:outline-2 focus-visible:outline-brand-yellow focus-visible:outline-offset-2`}
              href={productHref}
              rel="noreferrer"
              target="_blank"
            >
              <StockThumb alt={item.productName} src={item.imageUrl} />
            </Link>
          ) : (
            <span className={`${stockThumbFrameClassName} h-14 w-14`}>
              <StockThumb alt={item.productName} src={item.imageUrl} />
            </span>
          )}
          <div className="min-w-0">
            {isPublic ? (
              <Link
                className="block text-sm font-semibold text-[#1a1a1a] transition hover:text-[#1a1a1a]/72"
                href={productHref}
                rel="noreferrer"
                target="_blank"
              >
                {item.productName}
              </Link>
            ) : (
              <span className="block text-sm font-semibold text-[#1a1a1a]">
                {item.productName}
              </span>
            )}
            <p className="mt-1 text-[11px] font-black uppercase tracking-[0.14em] text-[#1a1a1a]/52">
              {item.sku || "Sem SKU"}
            </p>
            {!isPublic ? (
              <p
                className="mt-1 inline-flex w-fit items-center gap-1 rounded-lg border border-[#c0392b]/30 bg-[#f7e6e2] px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.12em] text-[#7a3428]"
                data-testid="stock-row-unpublishable"
              >
                Configure o peso para publicar
              </p>
            ) : null}
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
        {formatStockUpdatedAt(item.updatedAt)}
      </td>
      <td className="border-b border-brand-dark/15 px-4 py-3">
        <StockStatusBadge qty={item.qty} />
      </td>
      <td className="border-b border-brand-dark/15 px-4 py-3">
        <StockQtyField
          onQtyChange={onQtyChange}
          productId={item.productId}
          productName={item.productName}
          qty={qty}
          saving={saving}
        />
      </td>
    </tr>
  );
}
