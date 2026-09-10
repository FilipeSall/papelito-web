import Link from "next/link";
import { notFound } from "next/navigation";

import { VendorPageHeader } from "@/components/layout/vendor-panel";
import { ChamadoThreadPanel, getChamado } from "@/features/chamados";
import { redirectIfVendorOnboardingPending } from "@/features/revendedor/server/vendor-onboarding";

export default async function VendorSolicitacaoPage({
  params,
}: {
  params: Promise<{ chamadoId: string }>;
}) {
  const { chamadoId } = await params;

  await redirectIfVendorOnboardingPending(`/vendor/solicitacoes/${chamadoId}`);

  const solicitacao = await getChamado(chamadoId);

  if (!solicitacao) notFound();

  return (
    <div className="space-y-4 md:space-y-5">
      <VendorPageHeader
        description="Atendimento da Papelito sobre a autorização necessária para atualizar sua conta bancária na Pagar.me."
        eyebrow="Atendimento"
        signal="Papelito acompanhando"
        title="Solicitação"
      />

      <Link
        className="inline-flex w-fit items-center gap-2 text-[11px] font-black uppercase tracking-[0.18em] text-[#1a1a1a]/70 transition-colors hover:text-[#1a1a1a] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1a1a1a]"
        href="/vendor/solicitacoes"
      >
        &larr; Voltar às solicitações
      </Link>

      <ChamadoThreadPanel
        initialChamado={solicitacao}
        viewerName={solicitacao.participants.seller.name}
      />
    </div>
  );
}
