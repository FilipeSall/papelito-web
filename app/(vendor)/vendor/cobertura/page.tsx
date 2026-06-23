import { VendorCoverageManager, VendorPageHeader } from "@/components/layout/vendor-panel";
import { redirectIfVendorOnboardingPending } from "@/features/revendedor/server/vendor-onboarding";
import { getVendorCoverage } from "@/features/vendor-coverage/server";

export default async function VendorCoveragePage() {
  await redirectIfVendorOnboardingPending("/vendor/cobertura");

  const snapshot = await getVendorCoverage();

  return (
    <div className="space-y-4 md:space-y-5">
      <VendorPageHeader
        description="Defina as faixas de CEP que sua loja atende. Essas regras controlam a disponibilidade regional dos produtos para clientes."
        eyebrow="Regiao atendida"
        signal="cobertura"
        title="Cobertura"
      />
      <VendorCoverageManager snapshot={snapshot} />
    </div>
  );
}
