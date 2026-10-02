import { useEffect, useRef } from "react";
import Link from "next/link";

import type { VendorStockItem } from "@/features/vendor-stock/types/vendor-stock";
import { vendorStockLevel } from "@/features/vendor-stock/types/vendor-stock";

import {
  formatStockUpdatedAt,
  StockItemCodes,
  StockMissingData,
  StockQtyField,
  StockSelectCell,
  StockStatusBadge,
  StockThumb,
  stockThumbFrameClassName,
} from "./stock-cells";
import { buildWhatsappHref } from "./stock-status";
import { StockDescriptionAction, StockDescriptionMarker } from "./stock-description-action";

export function StockRow({
  contactPhone,
  focused,
  lowStockThreshold,
  onQtyChange,
  onRequestData,
  onEditDescription,
  onToggle,
  qty,
  requested,
  saved,
  saving,
  selected,
  item,
}: Readonly<{
  contactPhone: string;
  focused: boolean;
  item: VendorStockItem;
  lowStockThreshold: number;
  onQtyChange: (productId: number, qty: string) => void;
  onRequestData: (item: VendorStockItem) => void;
  onEditDescription?: (item: VendorStockItem) => void;
  onToggle: (productId: number, selected: boolean) => void;
  qty: string;
  requested: boolean;
  saved: boolean;
  saving: boolean;
  selected: boolean;
}>) {
  const ref = useRef<HTMLTableRowElement>(null);
  const productHref = `/produtos/${item.publicProductId || item.productId}`;
  const isPublic = item.isPubliclyViewable;
  const level = vendorStockLevel(item, lowStockThreshold);
  const whatsappHref = buildWhatsappHref(contactPhone, item.productName, item.missingFields);
  let rowClassName = "bg-[#faf8f2]";

  if (selected) rowClassName = "bg-brand-yellow/12";
  if (focused) rowClassName = "bg-brand-yellow/22";

  useEffect(() => {
    if (focused) ref.current?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [focused]);

  return (
    <tr className={rowClassName} ref={ref}>
      <td className="border-b border-brand-dark/15 px-2 py-3 align-top">
        <StockSelectCell
          checked={selected}
          label={`Selecionar ${item.productName}`}
          onChange={(next) => onToggle(item.productId, next)}
        />
      </td>
      <td className="border-b border-brand-dark/15 px-4 py-3">
        <div className="flex min-w-64 items-start gap-3">
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
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
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
              <StockDescriptionAction item={item} onEdit={onEditDescription} />
            </div>
            <StockItemCodes sku={item.sku} vendorCode={item.vendorCode} />
            {item.categories.length > 0 || item.tags.length > 0 || item.hasDescriptionOverride ? (
              <div className="mt-2 flex flex-wrap gap-1.5" data-testid="stock-row-terms">
                {[...item.categories, ...item.tags].map((term) => (
                  <span
                    className="inline-flex items-center rounded-lg border border-brand-dark/12 bg-white px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.12em] text-brand-dark/64"
                    key={`${term.slug}-${term.id}`}
                  >
                    {term.name}
                  </span>
                ))}
                <StockDescriptionMarker item={item} />
              </div>
            ) : null}
            <StockMissingData
              fields={item.missingFields}
              onRequest={() => onRequestData(item)}
              requested={requested}
              whatsappHref={whatsappHref}
            />
          </div>
        </div>
      </td>
      <td className="border-b border-brand-dark/15 px-4 py-3 align-top">
        <StockStatusBadge level={level} />
      </td>
      <td className="border-b border-brand-dark/15 px-4 py-3 align-top text-sm text-[#1a1a1a]/68">
        {formatStockUpdatedAt(item.updatedAt)}
      </td>
      <td className="border-b border-brand-dark/15 px-4 py-3 align-top">
        <StockQtyField
          onQtyChange={onQtyChange}
          productId={item.productId}
          productName={item.productName}
          qty={qty}
          saved={saved}
          saving={saving}
        />
      </td>
    </tr>
  );
}
