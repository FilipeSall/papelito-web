import Link from "next/link";
import { notFound } from "next/navigation";

import { ProfilePageTitle, ProfilePanel, ReturnCancelButton } from "@/components/layout/profile-page";
import {
  returnMethodLabel,
  returnReasonLabel,
  returnStatusMeta,
} from "@/features/returns/return-status";
import { mapVendorReturn } from "@/features/returns/services/get-vendor-returns";
import { getUserApiSession } from "@/lib/server/company-api";
import { wpRest } from "@/lib/server/wp-rest";

export const dynamic = "force-dynamic";

const CANCELLABLE = new Set(["requested", "awaiting_reverse_authorization", "awaiting_posting"]);

function formatDate(value: string) {
  if (!value) return "";
  const date = new Date(`${value.replace(" ", "T")}Z`);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Sao_Paulo" }).format(date);
}

function formatBRL(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { currency: "BRL", style: "currency" });
}

export default async function ProfileReturnDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();

  const session = await getUserApiSession();
  if ("error" in session) notFound();
  const result = await wpRest<Record<string, unknown>>(`/papelito/v1/profile/me/returns/${id}`, {
    headers: { Authorization: `Bearer ${session.accessToken}` },
  });
  if (!result.ok) notFound();

  const data = mapVendorReturn(result.data);
  const meta = returnStatusMeta(data.status);

  return (
    <main className="mx-auto max-w-4xl space-y-5 px-4 py-8">
      <Link className="text-xs font-black uppercase tracking-[0.18em] underline underline-offset-4" href="/perfil/devolucoes">
        Todas as devoluções
      </Link>
      <ProfilePageTitle description={`Pedido #${data.orderId} · ${returnReasonLabel(data.reason)}`} title="Detalhe da devolução" />

      <ProfilePanel tone="white">
        <div className="space-y-4 px-5 py-6 md:px-7">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#1a1a1a]/60">Situação atual</p>
              <p className="mt-1 text-lg font-black uppercase tracking-tight text-[#1a1a1a]">{meta.label}</p>
            </div>
            {CANCELLABLE.has(data.status) ? <ReturnCancelButton returnId={data.id} /> : null}
          </div>

          {data.authorizationCode ? (
            <section className="border-2 border-[#1a1a1a] bg-brand-yellow/25 p-4">
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#1a1a1a]">Autorização de postagem reversa</p>
              <p className="mt-3 break-all text-2xl font-black tracking-tight text-[#1a1a1a]">{data.authorizationCode}</p>
              <p className="mt-2 text-sm font-semibold text-[#1a1a1a]/80">Válida até {formatDate(data.authorizationExpiresAt)}</p>
              {data.authorizationInstructions ? <p className="mt-3 whitespace-pre-line text-sm leading-6 text-[#1a1a1a]/80">{data.authorizationInstructions}</p> : null}
              <p className="mt-3 text-xs font-bold leading-5 text-[#1a1a1a]/70">Apresente este código na agência indicada pelo vendor. O código não é o rastreio S10.</p>
            </section>
          ) : (
            <p className="border-2 border-dashed border-[#1a1a1a]/30 p-4 text-sm leading-6 text-[#1a1a1a]/72">
              {data.status === "awaiting_reverse_authorization" ? "O vendor está preparando sua autorização de postagem." : "Ainda não há autorização de postagem disponível."}
            </p>
          )}

          <section>
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#1a1a1a]/60">Itens</p>
            <ul className="mt-2 divide-y-2 divide-[#1a1a1a]/10">
              {data.items.map((item) => (
                <li className="flex items-center justify-between gap-3 py-3" key={item.id}>
                  <span className="text-sm font-bold text-[#1a1a1a]">{item.productName} · {item.requestedQty} un.</span>
                  <span className="shrink-0 text-sm font-black text-[#1a1a1a]">{formatBRL(item.eligibleAmountCents)}</span>
                </li>
              ))}
            </ul>
          </section>

          {data.refund ? (
            <section className="border-t-2 border-[#1a1a1a]/10 pt-4">
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#1a1a1a]/60">Estorno</p>
              <p className="mt-2 text-sm font-bold text-[#1a1a1a]">{formatBRL(data.refund.amountCents)} · {returnMethodLabel(data.refund.method)} · {formatDate(data.refund.refundedAt)}</p>
              <a className="mt-3 inline-block text-xs font-black uppercase tracking-[0.16em] underline underline-offset-4" href={`/api/returns/proofs/${data.refund.proofId}`}>Baixar comprovante</a>
            </section>
          ) : null}

          <Link className="inline-block text-xs font-black uppercase tracking-[0.16em] underline underline-offset-4" href={`/perfil/pedidos/${data.orderId}/suporte`}>
            Falar com o vendor
          </Link>
        </div>
      </ProfilePanel>
    </main>
  );
}
