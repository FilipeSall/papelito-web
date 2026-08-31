import { VendorCoverageManager, VendorPageHeader } from "@/components/layout/vendor-panel";
import { redirectIfVendorOnboardingPending } from "@/features/revendedor/server/vendor-onboarding";
import { getVendorCoverage } from "@/features/vendor-coverage/server";

export default async function VendorCoveragePage() {
  await redirectIfVendorOnboardingPending("/vendor/cobertura");

  const snapshot = await getVendorCoverage();

  return (
    <div className="flex flex-col space-y-4 md:space-y-5 xl:h-full" data-fill-viewport>
      <div className="shrink-0">
        <VendorPageHeader
          description="Defina as faixas de CEP que sua loja atende. Essas regras controlam a disponibilidade regional dos produtos para clientes."
          eyebrow="Região atendida"
          signal="cobertura"
          title="Cobertura"
        />
      </div>
      <VendorCoverageManager snapshot={snapshot} />
    </div>
  );
}
