import { VendorPageHeader, VendorSettingsForm } from "@/components/layout/vendor-panel";
import { redirectIfVendorOnboardingPending } from "@/features/revendedor/server/vendor-onboarding";
import { getVendorSettings } from "@/features/vendor-settings/server";

export default async function VendorSettingsPage() {
  await redirectIfVendorOnboardingPending("/vendor/configuracoes");

  const settings = await getVendorSettings();

  return (
    <div className="space-y-4 md:space-y-5">
      <VendorPageHeader
        description="Configure informacoes que afetam prazo e expectativa de entrega para os clientes atendidos por sua loja."
        eyebrow="Operacao da loja"
        signal="configuracao"
        title="Configuracoes"
      />
      <VendorSettingsForm initialLeadTimeDays={settings.shippingLeadTimeDays} />
    </div>
  );
}
