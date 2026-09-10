import { Package, Search } from "lucide-react";

import {
  EmptyResult,
  FOCUS_RING,
  ResultFrame,
  ResultRow,
  StatusChip,
} from "@/components/layout/operational-panel";

import type { ChamadoSummary } from "../types/chamado";
import { chamadoDateLabel } from "../utils/chamado-date-label";
import { chamadoReasonLabel } from "../utils/chamado-reason";
import { chamadoStatusMeta } from "../utils/chamado-status";

type ChamadosListAudience = "admin" | "customer" | "vendor";

const BASE_HREF: Record<ChamadosListAudience, (threadId: number) => string> = {
  admin: (threadId) => `/admin/chamados?chamado=${threadId}`,
  customer: (threadId) => `/perfil/chamados/${threadId}`,
  vendor: (threadId) => `/vendor/chamados/${threadId}`,
};

/**
 * Lista de chamados como uma folha só, com linhas dentro.
 *
 * Uma pilha de cards com sombra dura cada vira mancha; a moldura de resultado é o padrão do
 * painel e é ela que mantém as três audiências com a mesma leitura.
 */
export function ChamadosList({
  audience,
  emptyBody = "Quando você abrir um chamado sobre um pedido, ele aparece aqui.",
  emptyTitle = "Nenhum chamado ainda",
  items,
  search = "",
  searchAction,
  selectedThreadId = null,
  total,
}: Readonly<{
  audience: ChamadosListAudience;
  emptyBody?: string;
  emptyTitle?: string;
  items: ChamadoSummary[];
  search?: string;
  searchAction?: string;
  selectedThreadId?: number | null;
  total?: number;
}>) {
  const count = total ?? items.length;

  const searchForm = searchAction ? (
    <form action={searchAction} className="flex w-full gap-2 sm:w-auto">
      <label className="sr-only" htmlFor={`busca-${audience}`}>
        Buscar chamado
      </label>
      <input
        className={`h-9 min-w-0 flex-1 rounded-none border-2 border-[#1a1a1a] bg-white px-3 text-sm text-[#1a1a1a] placeholder:text-[#1a1a1a]/40 sm:w-72 ${FOCUS_RING}`}
        defaultValue={search}
        id={`busca-${audience}`}
        name="search"
        placeholder="Nº do pedido ou nome"
      />
      <button
        className={`inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-none border-2 border-[#1a1a1a] bg-[#1a1a1a] px-4 text-[10px] font-black uppercase tracking-[0.18em] text-brand-yellow ${FOCUS_RING}`}
        type="submit"
      >
        <Search aria-hidden className="h-3.5 w-3.5" strokeWidth={2.4} />
        Buscar
      </button>
    </form>
  ) : undefined;

  if (items.length === 0) {
    return (
      <div className="space-y-4">
        {searchForm}
        <EmptyResult body={emptyBody} title={emptyTitle} />
      </div>
    );
  }

  return (
    <ResultFrame
      action={searchForm}
      summary={`${count} ${count === 1 ? "chamado" : "chamados"}`}
    >
      {items.map((chamado) => {
        const statusMeta = chamadoStatusMeta(chamado.status);
        const active = chamado.threadId === selectedThreadId;

        return (
          <ResultRow
            href={BASE_HREF[audience](chamado.threadId)}
            key={chamado.threadId}
            lead={
              <div className={active ? "border-l-4 border-brand-yellow pl-3" : ""}>
                <p className="flex flex-wrap items-center gap-2 text-sm font-black uppercase tracking-[0.1em] text-[#1a1a1a]">
                  <Package aria-hidden className="h-4 w-4 shrink-0" strokeWidth={2.4} />
                  {chamado.orderNumber ? `Pedido #${chamado.orderNumber}` : "Sem pedido"}
                </p>
                <p className="mt-1 text-sm font-semibold text-[#1a1a1a]">
                  {chamadoReasonLabel(chamado.reason, chamado.reasonLabel)}
                </p>
                <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.12em] text-[#231f20]/55">
                  Aberto em {chamadoDateLabel(chamado.openedAt)}
                </p>
              </div>
            }
            meta={
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-[#1a1a1a]">
                  {chamado.counterpartName}
                </p>
                <p className="mt-1 line-clamp-2 text-sm leading-5 text-[#231f20]/64">
                  {chamado.lastMessage?.plainText ?? "Sem mensagem"}
                </p>
              </div>
            }
            trailing={
              <>
                {chamado.unreadCount > 0 ? (
                  <span
                    className="inline-flex min-h-7 items-center rounded-none border-2 border-[#1a1a1a] bg-[#1a1a1a] px-2.5 text-[10px] font-black uppercase tracking-[0.14em] text-brand-yellow"
                    data-numeric
                  >
                    {chamado.unreadCount} nova{chamado.unreadCount === 1 ? "" : "s"}
                  </span>
                ) : null}
                <StatusChip icon={statusMeta.icon} label={statusMeta.label} tone={statusMeta.tone} />
              </>
            }
          />
        );
      })}
    </ResultFrame>
  );
}
