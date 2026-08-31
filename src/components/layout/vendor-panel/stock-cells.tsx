import { Loader2 } from "lucide-react";

import { ImageWithSkeleton, ProductImageFallback } from "@/components/ui";

export const stockThumbFrameClassName =
  "relative shrink-0 overflow-hidden rounded-[10px] border border-brand-dark/12 bg-white p-1";

const stockDateFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "America/Sao_Paulo",
});

export function formatStockUpdatedAt(value: string): string {
  if (!value) return "Sem atualização";

  const timestamp = /(?:Z|[+-]\d{2}:?\d{2})$/.test(value)
    ? value
    : `${value.replace(" ", "T")}Z`;
  const date = new Date(timestamp);

  return Number.isNaN(date.getTime()) ? value : stockDateFormatter.format(date);
}

export function StockThumb({
  alt,
  sizes = "56px",
  src,
}: {
  alt: string;
  sizes?: string;
  src: string;
}) {
  if (!src) {
    return <ProductImageFallback className="h-full w-full" />;
  }

  return (
    <ImageWithSkeleton
      alt={alt}
      fallback={<ProductImageFallback className="h-full w-full" />}
      imageClassName="object-contain"
      sizes={sizes}
      src={src}
    />
  );
}

export function StockStatusBadge({ qty }: { qty: number }) {
  return (
    <span
      className={`inline-flex min-h-8 items-center justify-center rounded-lg border px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] ${
        qty === 0
          ? "border-[#c0392b]/30 bg-[#f7e6e2] text-[#7a3428]"
          : "border-brand-dark bg-brand-dark text-brand-yellow"
      }`}
    >
      {qty === 0 ? "Zerado" : "Disponível"}
    </span>
  );
}

export function StockQtyField({
  onQtyChange,
  productId,
  productName,
  qty,
  saving,
}: {
  onQtyChange: (productId: number, qty: string) => void;
  productId: number;
  productName: string;
  qty: string;
  saving: boolean;
}) {
  return (
    <div className="flex items-center justify-end gap-2">
      <span aria-hidden={!saving} className="flex h-4 w-4 shrink-0 items-center justify-center">
        {saving ? (
          <Loader2 aria-label="Salvando" className="h-4 w-4 animate-spin text-[#1a1a1a]/60" strokeWidth={2} />
        ) : null}
      </span>
      <input
        aria-label={`Quantidade de ${productName}`}
        className="h-10 w-20 rounded-[10px] border border-brand-dark/15 bg-white px-3 text-right text-sm text-brand-dark outline-none focus-visible:outline-2 focus-visible:outline-brand-yellow focus-visible:outline-offset-2"
        min={0}
        onChange={(event) => onQtyChange(productId, event.target.value)}
        onFocus={(event) => event.currentTarget.select()}
        type="number"
        value={qty}
      />
    </div>
  );
}
