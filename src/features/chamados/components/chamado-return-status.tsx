import { ExternalLink } from "lucide-react";
import Link from "next/link";

import { FOCUS_RING, StatusChip } from "@/components/layout/operational-panel";
import { returnStatusMeta } from "@/features/returns/return-status";
import type { VendorReturnStatus } from "@/features/returns/types/vendor-return";

import type { ChamadoReturnRequest, ChamadoRole } from "../types/chamado";

/** O registro de devolução não tem tela de detalhe para o admin. */
function returnHref(role: ChamadoRole, returnId: number) {
  if (role === "customer") return `/perfil/devolucoes/${returnId}`;
  if (role === "seller") return `/vendor/devolucoes/${returnId}`;
  return null;
}

/**
 * Andamento da devolução, dentro do chamado.
 *
 * O chamado é a conversa e a devolução é a logística reversa — entidades diferentes, com ciclos
 * de vida diferentes. Mostrar o andamento aqui evita mandar o cliente procurar em outra área o
 * desfecho do assunto que ele abriu nesta.
 */
export function ChamadoReturnStatus({
  returnRequest,
  role,
}: Readonly<{
  returnRequest: ChamadoReturnRequest | null;
  role: ChamadoRole;
}>) {
  if (!returnRequest) return null;

  const meta = returnStatusMeta(returnRequest.status as VendorReturnStatus);
  const href = returnHref(role, returnRequest.id);
  const actionLabel =
    role === "customer" && returnRequest.status === "refunded"
      ? "Acompanhar estorno"
      : "Acompanhar devolução";

  return (
    <div className="flex flex-wrap items-center gap-3 border-b-2 border-[#1a1a1a]/10 bg-[#f7f2e7] px-5 py-3">
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#231f20]/55">
        Devolução #{returnRequest.id}
      </p>
      <StatusChip
        compact
        icon={meta.icon}
        label={meta.label}
        tone={meta.tone}
      />
      {meta.callToAction ? (
        <span className="text-xs font-semibold text-[#231f20]/64">
          {meta.callToAction}
        </span>
      ) : null}
      {href ? (
        <Link
          className={`ml-auto inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-[0.18em] text-[#1a1a1a] underline decoration-2 underline-offset-4 ${FOCUS_RING}`}
          href={href}
        >
          {actionLabel}
          <ExternalLink aria-hidden className="h-3.5 w-3.5" strokeWidth={2.4} />
        </Link>
      ) : null}
    </div>
  );
}
