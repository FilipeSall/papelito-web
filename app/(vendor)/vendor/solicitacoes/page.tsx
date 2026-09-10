import { VendorPageHeader } from "@/components/layout/vendor-panel";
import { EmptyResult } from "@/components/layout/operational-panel";
import { getChamados } from "@/features/chamados";
import { redirectIfVendorOnboardingPending } from "@/features/revendedor/server/vendor-onboarding";
import { firstParam } from "@/lib/search-params";

import { SolicitacoesList } from "./solicitacoes-list";

/**
 * Conversas com a Papelito que não pertencem a um pedido — hoje, a autorização bancária da
 * Pagar.me. Elas ficam fora de Chamados justamente porque chamado tem pedido.
 */
export default async function VendorSolicitacoesPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  await redirectIfVendorOnboardingPending("/vendor/solicitacoes");

  const params = searchParams ? await searchParams : {};
  const page = Math.max(1, Number.parseInt(firstParam(params.page) ?? "", 10) || 1);
  const solicitacoes = await getChamados({ kind: "solicitacao", page });

  return (
    <div className="space-y-4 md:space-y-5">
      <VendorPageHeader
        description="Assuntos tratados direto com a Papelito, sem vínculo com um pedido."
        eyebrow="Atendimento"
        signal={`${solicitacoes.total} solicitaç${solicitacoes.total === 1 ? "ão" : "ões"}`}
        title="Solicitações à Papelito"
      />

      {solicitacoes.items.length === 0 ? (
        <EmptyResult
          body="Quando você pedir algo à Papelito — como a autorização para trocar a conta bancária — a conversa aparece aqui."
          title="Nenhuma solicitação aberta"
        />
      ) : (
        <SolicitacoesList items={solicitacoes.items} total={solicitacoes.total} />
      )}
    </div>
  );
}
