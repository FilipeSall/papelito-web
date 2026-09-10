"use client";

import {
  CalendarDays,
  ChevronDown,
  CreditCard,
  ExternalLink,
  Package,
  Store,
} from "lucide-react";
import Link from "next/link";
import { useId, useState } from "react";

import { useMediaQuery } from "@/hooks/use-media-query";

import { FOCUS_RING, HardPanel, StatusChip } from "@/components/layout/operational-panel";

import type { ChamadoOrderContext, ChamadoRole } from "../types/chamado";
import { chamadoCurrency, chamadoDayLabel } from "../utils/chamado-money";

const VISIBLE_ITEMS = 4;

/** Quem atende precisa de uma porta para o pedido; o admin não tem rota de detalhe de pedido. */
function orderHref(role: ChamadoRole, orderId: number) {
  if (role === "customer") return `/perfil/pedidos/${orderId}`;
  if (role === "seller") return `/vendor/pedidos/${orderId}`;
  return null;
}

function Fact({
  icon: Icon,
  label,
  value,
}: Readonly<{ icon: typeof Store; label: string; value: string }>) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-[#1a1a1a]/60" strokeWidth={2.4} />
      <div className="min-w-0">
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#231f20]/55">
          {label}
        </p>
        <p className="mt-0.5 truncate text-sm font-semibold text-[#1a1a1a]">{value || "—"}</p>
      </div>
    </div>
  );
}

/**
 * Contexto da compra dentro do chamado.
 *
 * Não é a página de detalhe do pedido: é o suficiente para quem atende entender do que o cliente
 * está falando sem sair da conversa. A linha de resumo continua visível quando colapsado — é o
 * que torna o estado fechado honesto.
 */
export function ChamadoOrderPanel({
  fallbackOrderNumber = "",
  order,
  reasonLabel,
  role,
}: Readonly<{
  fallbackOrderNumber?: string;
  order: ChamadoOrderContext | null;
  reasonLabel: string | null;
  role: ChamadoRole;
}>) {
  // No desktop o painel cabe ao lado da conversa e fica aberto; no mobile começa fechado para não
  // empurrar as mensagens para fora da tela. `null` = ainda não houve escolha manual.
  const isDesktop = useMediaQuery("(min-width: 80rem)");
  const [manualOpen, setManualOpen] = useState<boolean | null>(null);
  const open = manualOpen ?? isDesktop;
  const baseId = useId();
  const regionId = `${baseId}-corpo`;
  const titleId = `${baseId}-titulo`;

  const orderNumber = order?.number ?? fallbackOrderNumber;
  const href = order ? orderHref(role, order.id) : null;
  const extraItems = order ? Math.max(0, order.items.length - VISIBLE_ITEMS) : 0;

  return (
    <HardPanel accent="yellow" className="xl:sticky xl:top-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-[#1a1a1a] px-5 py-3">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-[#231f20]/55">
            <span aria-hidden className="inline-block h-2.5 w-2.5 rotate-45 bg-brand-yellow" />
            Contexto da compra
          </p>
          <h2 className="mt-1.5 text-base font-black uppercase tracking-tight text-[#1a1a1a]" id={titleId}>
            {orderNumber ? `Pedido #${orderNumber}` : "Pedido não vinculado"}
          </h2>
        </div>

        <button
          aria-controls={regionId}
          aria-expanded={open}
          className={`inline-flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-none border-2 border-[#1a1a1a]/25 bg-white text-[#1a1a1a] transition hover:border-[#1a1a1a] hover:bg-brand-yellow xl:hidden ${FOCUS_RING}`}
          onClick={() => setManualOpen(!open)}
          type="button"
        >
          <span className="sr-only">{open ? "Recolher contexto do pedido" : "Ver contexto do pedido"}</span>
          <ChevronDown
            aria-hidden
            className={`h-4 w-4 transition-transform motion-reduce:transition-none ${open ? "rotate-180" : ""}`}
            strokeWidth={2.4}
          />
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2.5 border-b-2 border-[#1a1a1a]/10 px-5 py-3">
        {order ? (
          <StatusChip
            compact
            icon={Package}
            label={order.statusLabel || order.status || "Sem status"}
            tone="neutral"
          />
        ) : null}
        {reasonLabel ? (
          <span className="text-[10px] font-black uppercase tracking-[0.14em] text-[#231f20]/60">
            {reasonLabel}
          </span>
        ) : null}
        {order ? (
          <span
            className="ml-auto text-sm font-black text-[#1a1a1a]"
            data-numeric
          >
            {chamadoCurrency(order.total)}
          </span>
        ) : null}
      </div>

      <div
        aria-labelledby={titleId}
        className={`grid transition-[grid-template-rows,opacity] duration-200 motion-reduce:transition-none xl:grid-rows-[1fr] xl:opacity-100 ${
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
        id={regionId}
        role="region"
      >
        <div className="overflow-hidden">
          {order ? (
            <div className="space-y-4 px-5 py-4">
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                <Fact icon={Store} label="Loja" value={order.storeLabel} />
                <Fact icon={CalendarDays} label="Compra" value={chamadoDayLabel(order.createdAt)} />
                <Fact icon={CreditCard} label="Pagamento" value={order.paymentMethodLabel} />
              </div>

              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#231f20]/55">
                  {order.itemsTotalCount} {order.itemsTotalCount === 1 ? "item" : "itens"}
                </p>
                <ul className="mt-2 divide-y-2 divide-[#1a1a1a]/10 border-2 border-[#1a1a1a]/15 bg-white">
                  {order.items.slice(0, VISIBLE_ITEMS).map((item) => (
                    <li className="flex items-start justify-between gap-3 px-3 py-2" key={item.id}>
                      <span className="min-w-0 text-sm leading-5 text-[#1a1a1a]">
                        <span className="font-black" data-numeric>
                          {item.quantity}×
                        </span>{" "}
                        {item.name}
                      </span>
                      <span className="shrink-0 text-sm font-semibold text-[#1a1a1a]" data-numeric>
                        {chamadoCurrency(item.lineTotal)}
                      </span>
                    </li>
                  ))}
                  {extraItems > 0 ? (
                    <li className="px-3 py-2 text-[11px] font-bold uppercase tracking-[0.14em] text-[#231f20]/55">
                      + {extraItems} {extraItems === 1 ? "item" : "itens"}
                    </li>
                  ) : null}
                </ul>
              </div>

              <dl className="space-y-1.5 border-t-2 border-[#1a1a1a]/10 pt-3 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-[#231f20]/64">Subtotal</dt>
                  <dd className="font-semibold text-[#1a1a1a]" data-numeric>
                    {chamadoCurrency(order.subtotal)}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-[#231f20]/64">Frete</dt>
                  <dd className="font-semibold text-[#1a1a1a]" data-numeric>
                    {chamadoCurrency(order.shipping)}
                  </dd>
                </div>
                <div className="flex justify-between gap-3 border-t-2 border-[#1a1a1a]/10 pt-1.5">
                  <dt className="font-black uppercase tracking-[0.14em] text-[#1a1a1a]">Total</dt>
                  <dd className="font-black text-[#1a1a1a]" data-numeric>
                    {chamadoCurrency(order.total)}
                  </dd>
                </div>
              </dl>

              {href ? (
                <Link
                  className={`inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.18em] text-[#1a1a1a] underline decoration-2 underline-offset-4 ${FOCUS_RING}`}
                  href={href}
                >
                  Ver pedido completo
                  <ExternalLink aria-hidden className="h-3.5 w-3.5" strokeWidth={2.4} />
                </Link>
              ) : null}
            </div>
          ) : (
            <p className="px-5 py-4 text-sm leading-6 text-[#231f20]/64">
              Os dados desta compra não estão disponíveis para este atendimento.
            </p>
          )}
        </div>
      </div>
    </HardPanel>
  );
}
