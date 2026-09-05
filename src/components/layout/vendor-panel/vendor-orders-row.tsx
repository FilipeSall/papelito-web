import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { FOCUS_RING, StatusChip } from "@/components/layout/operational-panel";
import type { VendorOrderSummary } from "@/features/vendor-orders/types/vendor-orders";
import { parseSiteDate, SAO_PAULO } from "@/features/vendor-orders/utils/order-dates";
import { formatBRLIntl } from "@/lib/format-currency";

import {
  FISCAL_ATTACHED_SHAPE,
  vendorOrderNextAction,
  vendorOrderStatusShape,
} from "./order-status";

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  timeZone: SAO_PAULO,
  year: "numeric",
});

export function formatOrderDate(value: string): string {
  const date = parseSiteDate(value);
  return date ? dateFormatter.format(date) : value || "Data não informada";
}

/**
 * Idade do pedido em linguagem de fila: "hoje", "há 3 dias".
 *
 * A data absoluta responde "quando", mas a pergunta operacional é "há quanto
 * tempo esse pedido está parado" — e essa não se responde lendo `12/06/2026`.
 */
export function formatOrderAge(value: string, now: number): string {
  const date = parseSiteDate(value);
  if (!date) return "";

  const days = Math.floor((now - date.getTime()) / 86_400_000);

  if (days <= 0) return "hoje";
  if (days === 1) return "ontem";
  if (days < 30) return `há ${days} dias`;

  const months = Math.floor(days / 30);
  return months === 1 ? "há 1 mês" : `há ${months} meses`;
}

/**
 * Linha da central de pedidos, nas três zonas fixas da moldura de resultado:
 * identidade, relacionamento e estado + próxima ação.
 *
 * A linha inteira navega, e a próxima ação aparece como texto dirigido, não
 * como botão: executar transição exige o contexto do detalhe — cancelar pede
 * justificativa, postar pede rastreio — e um botão aqui prometeria uma escrita
 * que a lista não consegue completar.
 */
export function VendorOrdersRow({ now, order }: { now: number; order: VendorOrderSummary }) {
  const shape = vendorOrderStatusShape(order.status);
  const age = formatOrderAge(order.createdAt, now);

  return (
    <li className="group relative bg-[#faf8f2] transition hover:bg-white">
      <div className="flex flex-col gap-3 px-5 py-4 lg:flex-row lg:items-center lg:gap-6">
        <div className="min-w-0 flex-1">
          <p className="font-mono text-sm font-bold tracking-wide text-[#1a1a1a]">
            #{order.orderNumber}
          </p>
          <p className="mt-1 truncate text-sm font-semibold text-[#1a1a1a]">{order.customerName}</p>
          <p className="mt-1 text-xs text-[#231f20]/62">
            <span className="tabular-nums">{formatOrderDate(order.createdAt)}</span>
            {age ? <span className="text-[#231f20]/55"> · {age}</span> : null}
          </p>
        </div>

        <div className="min-w-0 lg:w-[26%]">
          <p className="truncate text-sm text-[#231f20]/74" title={order.itemsLabel}>
            {order.itemsLabel}
          </p>
          <p className="mt-1 text-[10px] font-black uppercase tracking-[0.14em] text-[#231f20]/55">
            {order.itemsCount === 1 ? "1 item" : `${order.itemsCount} itens`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 lg:w-[38%] lg:justify-end">
          <div className="flex flex-wrap items-center gap-2">
            <StatusChip icon={shape.icon} label={shape.label} tone={shape.tone} />
            {/* Marcador do que existe, não do que falta: a fila de "pagos sem
                nota" já é a ficha de contagem no topo. */}
            {order.hasFiscalDocument ? (
              <StatusChip
                compact
                icon={FISCAL_ATTACHED_SHAPE.icon}
                label={FISCAL_ATTACHED_SHAPE.label}
                tone={FISCAL_ATTACHED_SHAPE.tone}
              />
            ) : null}
          </div>
          <div className="lg:min-w-32 lg:text-right">
            <p className="text-base font-black tabular-nums text-[#1a1a1a]">
              {formatBRLIntl(order.total)}
            </p>
            <p className="mt-0.5 inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-[0.12em] text-[#231f20]/62">
              <ArrowRight aria-hidden className="h-3 w-3 shrink-0" strokeWidth={2.6} />
              {vendorOrderNextAction(order.status)}
            </p>
          </div>
        </div>
      </div>

      <Link
        aria-label={`Abrir pedido #${order.orderNumber}`}
        className={["absolute inset-0", FOCUS_RING].join(" ")}
        href={`/vendor/pedidos/${order.id}`}
      >
        <span className="sr-only">Abrir pedido #{order.orderNumber}</span>
      </Link>
    </li>
  );
}
