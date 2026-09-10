import Link from "next/link";
import { notFound } from "next/navigation";

import { VendorPageHeader } from "@/components/layout/vendor-panel";
import { ChamadoOrderPanel, ChamadoThreadPanel, getChamado } from "@/features/chamados";
import { redirectIfVendorOnboardingPending } from "@/features/revendedor/server/vendor-onboarding";

export default async function VendorChamadoPage({
  params,
}: {
  params: Promise<{ chamadoId: string }>;
}) {
  const { chamadoId } = await params;

  await redirectIfVendorOnboardingPending(`/vendor/chamados/${chamadoId}`);

  const chamado = await getChamado(chamadoId);

  if (!chamado) notFound();

  return (
    <div className="space-y-4 md:space-y-5">
      <VendorPageHeader
        description={`Atendimento de ${chamado.participants.customer.name} sobre o pedido #${chamado.orderNumber}.`}
        eyebrow="Atendimento"
        signal={chamado.escalatedAt ? "Papelito acompanhando" : "Direto com o cliente"}
        title="Chamado"
      />

      <Link
        className="inline-flex w-fit items-center gap-2 text-[11px] font-black uppercase tracking-[0.18em] text-[#1a1a1a]/70 transition-colors hover:text-[#1a1a1a] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1a1a1a]"
        href="/vendor/chamados"
      >
        &larr; Voltar aos chamados
      </Link>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-start">
        <ChamadoThreadPanel initialChamado={chamado} viewerName={chamado.participants.seller.name} />
        <ChamadoOrderPanel
          fallbackOrderNumber={chamado.orderNumber}
          order={chamado.order}
          reasonLabel={chamado.reasonLabel}
          role="seller"
        />
      </div>
    </div>
  );
}
