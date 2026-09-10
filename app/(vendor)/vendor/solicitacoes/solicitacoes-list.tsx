import { LifeBuoy } from "lucide-react";

import { ResultFrame, ResultRow, StatusChip } from "@/components/layout/operational-panel";
import { chamadoStatusMeta, type ChamadoSummary } from "@/features/chamados";

export function SolicitacoesList({
  items,
  total,
}: Readonly<{ items: ChamadoSummary[]; total: number }>) {
  return (
    <ResultFrame summary={`${total} ${total === 1 ? "solicitação" : "solicitações"}`}>
      {items.map((solicitacao) => {
        const statusMeta = chamadoStatusMeta(solicitacao.status);

        return (
          <ResultRow
            href={`/vendor/solicitacoes/${solicitacao.threadId}`}
            key={solicitacao.threadId}
            lead={
              <p className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.1em] text-[#1a1a1a]">
                <LifeBuoy aria-hidden className="h-4 w-4 shrink-0" strokeWidth={2.4} />
                {solicitacao.counterpartName}
              </p>
            }
            meta={
              <p className="line-clamp-2 text-sm leading-5 text-[#231f20]/64">
                {solicitacao.lastMessage?.plainText ?? "Sem mensagem"}
              </p>
            }
            trailing={
              <StatusChip icon={statusMeta.icon} label={statusMeta.label} tone={statusMeta.tone} />
            }
          />
        );
      })}
    </ResultFrame>
  );
}
