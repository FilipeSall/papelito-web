import { Check, Loader2, MessageCircle, Send } from "lucide-react";

import { FOCUS_RING, StatusChip } from "@/components/layout/operational-panel";
import { ImageWithSkeleton, ProductImageFallback } from "@/components/ui";
import type {
  VendorStockLevel,
  VendorStockMissingField,
} from "@/features/vendor-stock/types/vendor-stock";

import {
  describeMissingFields,
  missingFieldIcon,
  missingFieldLabel,
  stockLevelShape,
} from "./stock-status";

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

export function StockStatusBadge({ level }: { level: VendorStockLevel }) {
  const shape = stockLevelShape(level);

  return <StatusChip icon={shape.icon} label={shape.label} tone={shape.tone} />;
}

/**
 * Caixa de seleção da linha.
 *
 * `min-h-11`/`min-w-11` na área clicável e não só na caixa desenhada: acertar um alvo de 16px em
 * lista longa é o gesto que mais falha no painel, e a caixa pequena continua sendo o desenho.
 */
export function StockSelectCell({
  checked,
  label,
  onChange,
}: {
  checked: boolean;
  label: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center">
      <input
        aria-label={label}
        checked={checked}
        className="peer sr-only"
        onChange={(event) => onChange(event.target.checked)}
        type="checkbox"
      />
      <span
        aria-hidden
        className={[
          "inline-flex h-5 w-5 items-center justify-center border-2 border-[#1a1a1a] transition",
          "peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[#1a1a1a] peer-focus-visible:shadow-[0_0_0_6px_#ffe500]",
          checked ? "bg-[#1a1a1a] text-brand-yellow" : "bg-white text-transparent",
        ].join(" ")}
      >
        <Check className="h-3.5 w-3.5" strokeWidth={3} />
      </span>
    </label>
  );
}

const rowActionClassName = [
  "inline-flex min-h-9 items-center gap-1.5 border-2 border-[#1a1a1a] bg-white px-2.5 text-[10px] font-black uppercase tracking-[0.14em] text-[#1a1a1a] transition hover:bg-brand-yellow disabled:cursor-not-allowed disabled:opacity-45",
  FOCUS_RING,
].join(" ");

/**
 * O que falta no cadastro de um produto, campo por campo, com as duas saídas para resolver.
 *
 * Nomeia os campos em vez de dizer "dados incompletos": sem o nome do campo o vendor tem que
 * abrir o produto para descobrir o que pedir, que é justamente o trabalho que essa área elimina.
 */
export function StockMissingData({
  fields,
  onRequest,
  requested,
  whatsappHref,
}: {
  fields: VendorStockMissingField[];
  onRequest: () => void;
  requested: boolean;
  whatsappHref: string | null;
}) {
  if (fields.length === 0) {
    return null;
  }

  return (
    <div className="mt-2 border-2 border-dashed border-[#c0392b]/55 bg-[#f7e6e2]/55 px-3 py-2">
      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#7a3428]">
        Dados incompletos · faltando {describeMissingFields(fields)}
      </p>
      <ul className="mt-1.5 flex flex-wrap gap-1.5">
        {fields.map((field) => {
          const Icon = missingFieldIcon(field);

          return (
            <li
              className="inline-flex items-center gap-1 border border-[#7a3428]/35 bg-white px-1.5 py-0.5 text-[10px] font-bold text-[#7a3428]"
              key={field}
            >
              <Icon aria-hidden className="h-3 w-3 shrink-0" strokeWidth={2.4} />
              {missingFieldLabel(field)}
            </li>
          );
        })}
      </ul>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <button
          className={rowActionClassName}
          disabled={requested}
          onClick={onRequest}
          type="button"
        >
          <Send aria-hidden className="h-3.5 w-3.5" strokeWidth={2.4} />
          {requested ? "Dados solicitados" : "Solicitar dados"}
        </button>
        {whatsappHref ? (
          <a
            className={rowActionClassName}
            href={whatsappHref}
            rel="noreferrer noopener"
            target="_blank"
          >
            <MessageCircle aria-hidden className="h-3.5 w-3.5" strokeWidth={2.4} />
            Falar no WhatsApp
          </a>
        ) : null}
      </div>
    </div>
  );
}

export function StockQtyField({
  disabled = false,
  onQtyChange,
  productId,
  productName,
  qty,
  saved = false,
  saving,
}: {
  disabled?: boolean;
  onQtyChange: (productId: number, qty: string) => void;
  productId: number;
  productName: string;
  qty: string;
  saved?: boolean;
  saving: boolean;
}) {
  return (
    <div className="flex items-center justify-end gap-2">
      <span className="flex h-4 w-4 shrink-0 items-center justify-center">
        {saving ? (
          <Loader2
            aria-label="Salvando"
            className="h-4 w-4 animate-spin text-[#1a1a1a]/60"
            strokeWidth={2}
          />
        ) : saved ? (
          <Check aria-label="Salvo" className="h-4 w-4 text-[#1a1a1a]" strokeWidth={3} />
        ) : null}
      </span>
      <input
        aria-label={`Quantidade de ${productName}`}
        className={[
          "h-10 w-20 rounded-[10px] border border-brand-dark/15 bg-white px-3 text-right text-sm tabular-nums text-brand-dark outline-none disabled:cursor-not-allowed disabled:opacity-50",
          FOCUS_RING,
        ].join(" ")}
        disabled={disabled}
        min={0}
        onChange={(event) => onQtyChange(productId, event.target.value)}
        onFocus={(event) => event.currentTarget.select()}
        type="number"
        value={qty}
      />
    </div>
  );
}
