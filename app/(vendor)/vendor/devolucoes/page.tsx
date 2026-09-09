import { VendorPageHeader, VendorReturnsBoard } from "@/components/layout/vendor-panel";
import { redirectIfVendorOnboardingPending } from "@/features/revendedor/server/vendor-onboarding";
import { getVendorReturns } from "@/features/returns/server";

export const dynamic = "force-dynamic";

export default async function VendorReturnsPage() {
  await redirectIfVendorOnboardingPending("/vendor/devolucoes");
  const returns = await getVendorReturns();

  return (
    <div className="space-y-4 md:space-y-5">
      <VendorPageHeader
        description="Pós-venda da sua loja: aprove ou recuse a solicitação, envie a autorização de postagem reversa, confirme o recebimento, inspecione os itens e registre o estorno."
        eyebrow="Pós-venda"
        signal="devoluções"
        title="Devoluções"
      />
      <VendorReturnsBoard returns={returns} />
    </div>
  );
}
