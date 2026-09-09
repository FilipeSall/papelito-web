import Link from "next/link";
import { ArrowRight, Inbox } from "lucide-react";

import { FOCUS_RING, StatusChip } from "@/components/layout/operational-panel";
import type { VendorReturn } from "@/features/returns/types/vendor-return";

import { returnReasonLabel, returnStatusMeta } from "@/features/returns/return-status";

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  timeZone: "America/Sao_Paulo",
  year: "numeric",
});

function formatDate(value: string) {
  if (!value) return "";
  const date = new Date(`${value.replace(" ", "T")}Z`);
  return Number.isNaN(date.getTime()) ? "" : dateFormatter.format(date);
}

function formatBRL(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { currency: "BRL", style: "currency" });
}

function ReturnRow({ data }: Readonly<{ data: VendorReturn }>) {
  const meta = returnStatusMeta(data.status);
  const units = data.items.reduce((total, item) => total + item.requestedQty, 0);

  return (
    <li>
      <Link
        className={`group flex flex-col gap-3 border-2 border-[#1a1a1a] bg-white px-4 py-4 transition hover:bg-brand-yellow/20 sm:flex-row sm:items-center sm:gap-5 ${FOCUS_RING}`}
        href={`/vendor/devolucoes/${data.id}`}
      >
        <div className="min-w-0 flex-1">
          <p className="text-sm font-black uppercase tracking-tight text-[#1a1a1a]">
            Pedido #{data.orderId}
          </p>
          <p className="mt-1 truncate text-xs font-semibold text-[#231f20]/70">
            {returnReasonLabel(data.reason)} · {units} {units === 1 ? "item" : "itens"} ·{" "}
            {formatBRL(data.eligibleAmountCents)}
          </p>
        </div>

        <div className="flex items-center gap-3 sm:justify-end">
          <div className="min-w-0">
            <StatusChip compact icon={meta.icon} label={meta.label} tone={meta.tone} />
            <p className="mt-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-[#231f20]/55">
              Aberta em {formatDate(data.requestedAt)}
            </p>
          </div>
          <ArrowRight
            aria-hidden
            className="h-4 w-4 shrink-0 text-[#1a1a1a] transition-transform group-hover:translate-x-0.5"
            strokeWidth={2.6}
          />
        </div>
      </Link>
    </li>
  );
}

function Group({
  count,
  description,
  items,
  title,
}: Readonly<{ count: number; description: string; items: VendorReturn[]; title: string }>) {
  if (items.length === 0) return null;

  return (
    <section>
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h2 className="text-[11px] font-black uppercase tracking-[0.22em] text-[#1a1a1a]">{title}</h2>
        <span className="text-[11px] font-black uppercase tracking-[0.18em] text-[#231f20]/55">
          {String(count).padStart(2, "0")}
        </span>
      </div>
      <p className="mt-1 text-xs font-semibold text-[#231f20]/70">{description}</p>
      <ul className="mt-3 space-y-3">
        {items.map((item) => (
          <ReturnRow data={item} key={item.id} />
        ))}
      </ul>
    </section>
  );
}

/**
 * Fila de devoluções separada pelo que cobra o vendor agora: o resto do fluxo
 * espera o cliente ou os Correios e não deve competir por atenção.
 */
export function VendorReturnsBoard({ returns }: Readonly<{ returns: VendorReturn[] }>) {
  if (returns.length === 0) {
    return (
      <div className="border-2 border-dashed border-[#1a1a1a]/40 bg-white px-5 py-10 text-center">
        <Inbox aria-hidden className="mx-auto h-7 w-7 text-[#1a1a1a]" strokeWidth={2.2} />
        <p className="mt-3 text-sm font-black uppercase tracking-[0.18em] text-[#1a1a1a]">
          Nenhuma devolução até agora
        </p>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#231f20]/74">
          Quando um cliente abrir uma devolução dentro do prazo, ela aparece aqui e você decide se aprova. Depois
          o fluxo segue por autorização de postagem, recebimento, inspeção e estorno.
        </p>
      </div>
    );
  }

  const actionable = returns.filter((item) => {
    const meta = returnStatusMeta(item.status);
    return meta.action !== null && !meta.waiting;
  });
  const waiting = returns.filter((item) => {
    const meta = returnStatusMeta(item.status);
    return meta.action !== null && meta.waiting;
  });
  const closed = returns.filter((item) => returnStatusMeta(item.status).action === null);

  return (
    <div className="space-y-7">
      <Group
        count={actionable.length}
        description="Paradas em você. Cada uma tem uma única ação pendente."
        items={actionable}
        title="Precisam de você"
      />
      <Group
        count={waiting.length}
        description="A postagem está com o cliente ou a encomenda está com os Correios."
        items={waiting}
        title="Em andamento"
      />
      <Group
        count={closed.length}
        description="Estornadas, recusadas, canceladas ou com autorização expirada."
        items={closed}
        title="Encerradas"
      />
    </div>
  );
}
