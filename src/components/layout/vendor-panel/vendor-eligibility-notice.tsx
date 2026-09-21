import Link from "next/link";
import { Lightbulb, TriangleAlert } from "lucide-react";

import { FOCUS_RING, StatusChip } from "@/components/layout/admin-panel/primitives";
import type { VendorPendingItem } from "@/features/vendor-eligibility/server";

/** Âncora que os indicadores da navegação usam para chegar até aqui. */
export const VENDOR_PENDENCIES_ID = "pendencias";

const RESOLVE_LABEL: Record<VendorPendingItem["kind"], string> = {
  advisory: "Ver caixas",
  blocking: "Resolver",
};

function PendingRow({ item }: Readonly<{ item: VendorPendingItem }>) {
  const blocking = item.kind === "blocking";

  return (
    <li className="flex flex-wrap items-start gap-x-4 gap-y-3 px-5 py-4 md:px-6">
      <StatusChip
        className="mt-0.5"
        icon={blocking ? TriangleAlert : Lightbulb}
        label={blocking ? "Impede a venda" : "Recomendação"}
        tone={blocking ? "critical" : "pending"}
      />
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#1a1a1a]">
          {item.title}
        </p>
        <p className="mt-1.5 text-sm leading-6 text-[#4a5565]">{item.detail}</p>
      </div>
      <Link
        className={[
          "shrink-0 self-center border-2 border-[#1a1a1a] bg-white px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-[#1a1a1a] transition hover:bg-[#1a1a1a] hover:text-white",
          FOCUS_RING,
        ].join(" ")}
        href={item.href}
      >
        {RESOLVE_LABEL[item.kind]}
      </Link>
    </li>
  );
}

/**
 * Painel que explica, no dashboard, por que a loja ainda não vende.
 *
 * É o destino de todo indicador da navegação e o único lugar que lista as pendências por extenso.
 * Só aparece quando existe bloqueio real: recomendação sozinha não justifica ocupar o topo do
 * dashboard toda visita, e mora na página onde se age sobre ela. Quando há bloqueio, as
 * recomendações entram junto, porque quem já vai mexer nas caixas resolve as duas de uma vez.
 */
export function VendorEligibilityNotice({
  pendencies,
}: Readonly<{ pendencies: VendorPendingItem[] }>) {
  const blocking = pendencies.filter((item) => item.kind === "blocking");

  if (blocking.length === 0) {
    return null;
  }

  return (
    <section
      aria-labelledby="pendencias-titulo"
      className="scroll-mt-28 border-2 border-[#1a1a1a] bg-[#faf8f2] shadow-[8px_8px_0px_#1a1a1a]"
      id={VENDOR_PENDENCIES_ID}
    >
      <div aria-hidden className="h-2 w-full bg-[#c0392b]" />
      <div className="border-b-2 border-[#1a1a1a] px-5 py-4 md:px-6">
        <div className="flex items-center gap-2">
          <span aria-hidden className="inline-block h-3 w-3 rotate-45 bg-[#c0392b]" />
          <h2
            className="text-[11px] font-black uppercase tracking-[0.22em] text-[#1a1a1a]"
            id="pendencias-titulo"
          >
            Pendências da sua loja
          </h2>
        </div>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#231f20]/70">
          Enquanto houver pendência que impede a venda, seus produtos não aparecem para os
          clientes. Sua conta e este painel continuam funcionando normalmente.
        </p>
      </div>
      <ul className="divide-y-2 divide-[#1a1a1a]/10">
        {pendencies.map((item) => (
          <PendingRow item={item} key={`${item.id}-${item.kind}`} />
        ))}
      </ul>
    </section>
  );
}
