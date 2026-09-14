import Link from "next/link";

import { getAdminOrderRefunds } from "@/features/order-refunds/services/get-admin-order-refunds";
import type { AdminOrderRefund, AdminOrderRefundsFilter } from "@/features/order-refunds/types/admin-order-refund";
import { formatBRLIntl } from "@/lib/format-currency";
import { firstParam } from "@/lib/search-params";

import { EmptyResult, SectionHeading } from "../primitives";

const FILTERS: Array<{ label: string; value: AdminOrderRefundsFilter }> = [
  { label: "Vencidos", value: "overdue" },
  { label: "Em aberto", value: "pending" },
  { label: "Todos", value: "all" },
];

const STATUS_LABEL: Record<AdminOrderRefund["status"], string> = {
  falhou: "Falha na Pagar.me",
  manual_pendente: "Devolução manual pendente",
  processando: "Em processamento",
  reembolsado: "Concluído",
};

const DAY_MS = 86_400_000;

const dateFormatter = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeZone: "America/Sao_Paulo" });

const labelClass = "text-[10px] font-black uppercase tracking-[0.18em] text-[#1a1a1a]/60";

const userLinkClass =
  "font-bold text-[#1a1a1a] underline decoration-2 underline-offset-4 hover:bg-brand-yellow focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1a1a1a]";

function currentTimestamp() {
  return Date.now();
}

function utcTime(value: string) {
  return value ? new Date(`${value.replace(" ", "T")}Z`).getTime() : Number.NaN;
}

function formatUtcDate(value: string) {
  const time = utcTime(value);
  return Number.isNaN(time) ? "" : dateFormatter.format(new Date(time));
}

function overdueLabel(item: AdminOrderRefund, now: number) {
  if (item.mode !== "manual" || item.status !== "manual_pendente") return "—";
  if (!item.overdue) return "No prazo";

  const days = Math.max(1, Math.floor((now - utcTime(item.refundDueAt)) / DAY_MS));

  return `⚠ Vencido há ${days} ${days === 1 ? "dia" : "dias"}`;
}

/**
 * Fila de estornos da Papelito. O vendor tem 7 dias para registrar a devolução
 * manual; passado o prazo o estorno aparece aqui, porque o registro é
 * auto-declaração e a cobrança não pode depender de alguém ir procurar.
 */
export async function OrderRefundsContent({
  searchParams,
}: Readonly<{ searchParams?: Record<string, string | string[] | undefined> }>) {
  const requested = firstParam(searchParams?.filtro) ?? "overdue";
  const filter = FILTERS.find((option) => option.value === requested)?.value ?? "overdue";
  const snapshot = await getAdminOrderRefunds(filter);
  const now = currentTimestamp();

  return (
    <div className="space-y-5">
      <SectionHeading
        description="Estornos de pedidos pagos que o vendor cancelou. Cartão e PIX voltam pela Pagar.me; boleto é devolvido pelo vendor por transferência, com prazo de 7 dias."
        title="Estornos"
      />

      <nav aria-label="Filtrar estornos" className="flex flex-wrap gap-2">
        {FILTERS.map((option) => {
          const active = option.value === filter;

          return (
            <a
              aria-current={active ? "page" : undefined}
              className={`inline-flex h-9 items-center rounded-none border-2 border-[#1a1a1a] px-4 text-[10px] font-black uppercase tracking-[0.18em] transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1a1a1a] ${
                active ? "bg-[#1a1a1a] text-brand-yellow" : "bg-white text-[#1a1a1a] hover:bg-brand-yellow"
              }`}
              href={`/admin/estornos?filtro=${option.value}`}
              key={option.value}
            >
              {option.label}
            </a>
          );
        })}
      </nav>

      {snapshot.unavailable ? (
        <EmptyResult
          body="A leitura falhou agora — isso não quer dizer que a fila está vazia. Recarregue a página em instantes."
          title="⚠ Não foi possível carregar os estornos"
        />
      ) : snapshot.items.length === 0 ? (
        <EmptyResult
          body={filter === "overdue" ? "Nenhuma devolução manual passou do prazo." : "Nenhum estorno neste filtro."}
          title="Nada por aqui"
        />
      ) : (
        <ul className="grid gap-4">
          {snapshot.items.map((item) => (
            <li
              className={`border-2 bg-[#faf8f2] p-5 shadow-[4px_4px_0px_#1a1a1a] ${
                item.overdue ? "border-[#c0392b]" : "border-[#1a1a1a]"
              }`}
              key={item.id}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-black uppercase tracking-tight text-[#1a1a1a]">Pedido #{item.orderId}</p>
                  <p className={`mt-1 ${labelClass}`}>
                    {STATUS_LABEL[item.status]} · {item.mode === "api" ? "Pagar.me" : "Transferência do vendor"}
                  </p>
                </div>
                <p className="text-lg font-black tabular-nums text-[#1a1a1a]">{formatBRLIntl(item.amountCents / 100)}</p>
              </div>

              <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <dt className={labelClass}>Prazo</dt>
                  <dd className="mt-1 font-bold text-[#1a1a1a]">{formatUtcDate(item.refundDueAt) || "—"}</dd>
                </div>
                <div>
                  <dt className={labelClass}>Situação do prazo</dt>
                  <dd className={`mt-1 font-bold ${item.overdue ? "text-[#c0392b]" : "text-[#1a1a1a]"}`}>
                    {overdueLabel(item, now)}
                  </dd>
                </div>
                <div>
                  <dt className={labelClass}>Vendor</dt>
                  <dd className="mt-1">
                    <Link className={userLinkClass} href={`/admin/users/${item.vendorId}`}>
                      Usuário #{item.vendorId}
                    </Link>
                  </dd>
                </div>
                <div>
                  <dt className={labelClass}>Comprador</dt>
                  <dd className="mt-1">
                    <Link className={userLinkClass} href={`/admin/users/${item.customerId}`}>
                      Usuário #{item.customerId}
                    </Link>
                  </dd>
                </div>
              </dl>

              {item.reason ? (
                <p className="mt-4 text-sm leading-6 text-[#231f20]/74">
                  <span className="font-black uppercase tracking-[0.1em] text-[#1a1a1a]">Justificativa:</span> {item.reason}
                </p>
              ) : null}

              {item.lastError ? (
                <p className="mt-2 text-xs leading-5 text-[#231f20]/62">
                  Retorno da Pagar.me ({item.attempts} {item.attempts === 1 ? "tentativa" : "tentativas"}): {item.lastError}
                </p>
              ) : null}

              {item.receiptNumber ? (
                <p className="mt-2 text-xs font-bold text-[#231f20]/74">Recibo de estorno {item.receiptNumber}</p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
