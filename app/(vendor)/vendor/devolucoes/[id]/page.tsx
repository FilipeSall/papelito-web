import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { FOCUS_RING, StatusChip } from "@/components/layout/operational-panel";
import { VendorReturnActions } from "@/components/layout/vendor-panel";
import {
  returnConditionLabel,
  returnMethodLabel,
  returnReasonLabel,
  returnStatusMeta,
} from "@/features/returns/return-status";
import { redirectIfVendorOnboardingPending } from "@/features/revendedor/server/vendor-onboarding";
import { getVendorReturn, getVendorReturnEvents } from "@/features/returns/server";

export const dynamic = "force-dynamic";

const dateTimeFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "America/Sao_Paulo",
});

function formatStamp(value: string) {
  if (!value) return "";
  const date = new Date(`${value.replace(" ", "T")}Z`);
  return Number.isNaN(date.getTime()) ? value : dateTimeFormatter.format(date);
}

function formatBRL(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { currency: "BRL", style: "currency" });
}

function Section({ children, title }: Readonly<{ children: ReactNode; title: string }>) {
  return (
    <section className="border-2 border-[#1a1a1a] bg-[#faf8f2] shadow-[8px_8px_0px_#1a1a1a]">
      <div aria-hidden className="h-2 w-full bg-brand-yellow" />
      <div className="border-b-2 border-[#1a1a1a] px-5 py-3">
        <h2 className="text-[10px] font-black uppercase tracking-[0.22em] text-[#231f20]/55">{title}</h2>
      </div>
      <div className="px-5 py-5 md:px-6">{children}</div>
    </section>
  );
}

function Fact({ label, value }: Readonly<{ label: string; value: string }>) {
  if (!value) return null;
  return (
    <div className="min-w-0">
      <dt className="text-[10px] font-black uppercase tracking-[0.18em] text-[#1a1a1a]/62">{label}</dt>
      <dd className="mt-1.5 text-sm leading-6 wrap-break-word text-[#231f20]/74">{value}</dd>
    </div>
  );
}

export default async function VendorReturnDetailPage({
  params,
}: Readonly<{ params: Promise<{ id: string }> }>) {
  const { id } = await params;
  await redirectIfVendorOnboardingPending(`/vendor/devolucoes/${id}`);

  if (!/^\d+$/.test(id)) notFound();

  const data = await getVendorReturn(id);
  if (!data) notFound();

  const events = await getVendorReturnEvents(id);
  const meta = returnStatusMeta(data.status);
  const units = data.items.reduce((total, item) => total + item.requestedQty, 0);

  return (
    <div className="space-y-4 md:space-y-5">
      <Link
        className={`inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.18em] text-[#1a1a1a] ${FOCUS_RING}`}
        href="/vendor/devolucoes"
      >
        <ArrowLeft aria-hidden className="h-3.5 w-3.5" strokeWidth={2.6} />
        Todas as devoluções
      </Link>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-3xl font-black uppercase tracking-tight text-[#1a1a1a] md:text-4xl">
            Devolução do pedido #{data.orderId}
          </h1>
          <p className="mt-2 text-sm leading-6 text-[#231f20]/74">
            {returnReasonLabel(data.reason)} · {units} {units === 1 ? "item" : "itens"} ·{" "}
            {formatBRL(data.eligibleAmountCents)} elegíveis · aberta em {formatStamp(data.requestedAt)}
          </p>
        </div>
        <StatusChip icon={meta.icon} label={meta.label} tone={meta.tone} />
      </div>

      <div className="grid gap-4 md:gap-5 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-4 md:space-y-5">
          <Section title={meta.action ? meta.callToAction : "Situação"}>
            <VendorReturnActions data={data} />
          </Section>

          <Section title="Itens da devolução">
            <ul className="divide-y-2 divide-[#1a1a1a]/8">
              {data.items.map((item) => (
                <li className="flex items-start justify-between gap-4 py-3 first:pt-0" key={item.id}>
                  <div className="min-w-0">
                    <p className="text-sm font-black text-[#1a1a1a]">{item.productName}</p>
                    <p className="mt-0.5 text-[10px] font-black uppercase tracking-[0.16em] text-[#231f20]/55">
                      Enviado {item.requestedQty}
                      {item.receivedQty !== null ? ` · recebido ${item.receivedQty}` : ""}
                      {item.condition ? ` · ${returnConditionLabel(item.condition)}` : ""}
                    </p>
                  </div>
                  <p className="shrink-0 text-sm font-black tabular-nums text-[#1a1a1a]">
                    {formatBRL(item.eligibleAmountCents)}
                  </p>
                </li>
              ))}
            </ul>
          </Section>
        </div>

        <div className="space-y-4 md:space-y-5">
          <Section title="Dados da devolução">
            <dl className="grid gap-4 sm:grid-cols-2">
              <Fact label="Motivo" value={returnReasonLabel(data.reason)} />
              <Fact label="Detalhe do cliente" value={data.reasonOther} />
              <Fact label="Código de autorização" value={data.authorizationCode} />
              <Fact label="Autorização válida até" value={formatStamp(data.authorizationExpiresAt)} />
              <Fact label="Instruções enviadas" value={data.authorizationInstructions} />
              <Fact label="Recebido em" value={formatStamp(data.receivedAt)} />
              <Fact label="Estorno devido até" value={formatStamp(data.refundDueAt)} />
              {data.refund ? (
                <>
                  <Fact label="Estorno registrado" value={formatBRL(data.refund.amountCents)} />
                  <Fact label="Meio do estorno" value={returnMethodLabel(data.refund.method)} />
                  <Fact label="Estornado em" value={formatStamp(data.refund.refundedAt)} />
                </>
              ) : null}
            </dl>
            {data.refund ? (
              <a
                className={`mt-5 inline-flex h-11 items-center gap-2 border-2 border-[#1a1a1a] bg-white px-4 text-[11px] font-black uppercase tracking-[0.18em] text-[#1a1a1a] transition hover:bg-brand-yellow ${FOCUS_RING}`}
                href={`/api/returns/proofs/${data.refund.proofId}`}
              >
                Baixar comprovante
              </a>
            ) : null}
          </Section>

          <Section title="Histórico">
            {events.length === 0 ? (
              <p className="text-sm text-[#231f20]/74">Nenhum evento registrado ainda.</p>
            ) : (
              <ol className="space-y-3">
                {events.map((event, index) => (
                  <li className="flex gap-3" key={`${event.createdAt}-${index}`}>
                    <span aria-hidden className="mt-1.5 h-2.5 w-2.5 shrink-0 rotate-45 bg-brand-yellow" />
                    <div className="min-w-0">
                      <p className="text-sm font-black text-[#1a1a1a]">
                        {event.toStatus ? returnStatusMeta(event.toStatus).label : event.event}
                      </p>
                      <p className="mt-0.5 text-[10px] font-black uppercase tracking-[0.16em] text-[#231f20]/55">
                        {formatStamp(event.createdAt)}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </Section>
        </div>
      </div>
    </div>
  );
}
