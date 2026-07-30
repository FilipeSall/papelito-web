import { VendorPageHeader, VendorRecipientPanel, VendorSettingsForm } from "@/components/layout/vendor-panel";
import { redirectIfVendorOnboardingPending } from "@/features/revendedor/server/vendor-onboarding";
import { getVendorRecipient } from "@/features/vendor-recipient/services/get-vendor-recipient";
import { getVendorSettings } from "@/features/vendor-settings/server";

export default async function VendorSettingsPage() {
  await redirectIfVendorOnboardingPending("/vendor/configuracoes");

  const [settings, recipient] = await Promise.all([
    getVendorSettings(),
    getVendorRecipient(),
  ]);

  return (
    <div className="space-y-4 md:space-y-5">
      <VendorPageHeader
        description="Configure informações que afetam prazo e expectativa de entrega para os clientes atendidos por sua loja."
        eyebrow="Operação da loja"
        signal="configuração"
        title="Configurações"
      />
      <VendorSettingsForm initialLeadTimeDays={settings.shippingLeadTimeDays} />
      <VendorRecipientPanel initialRecipient={recipient} />
    </div>
  );
}
