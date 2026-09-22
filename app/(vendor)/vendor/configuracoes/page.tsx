import {
  VendorAccountSection,
  VendorBraspressSection,
  VendorLeadTimeSection,
  VendorPageHeader,
  VendorRecipientPanel,
} from "@/components/layout/vendor-panel";
import { AnchoredSectionNav } from "@/components/ui/anchored-sections";
import { redirectIfVendorOnboardingPending } from "@/features/revendedor/server/vendor-onboarding";
import { getVendorRecipient } from "@/features/vendor-recipient/services/get-vendor-recipient";
import { getVendorBraspress, getVendorSettings } from "@/features/vendor-settings/server";

function vendorSignal(recipient: { loadFailed: boolean; status: string }) {
  if (recipient.loadFailed) return "estado não lido";

  return recipient.status === "active" ? "apta a vender" : "venda bloqueada";
}

const SECTIONS = [
  { id: "entrega", label: "Entrega" },
  { id: "transportadoras", label: "Transportadoras" },
  { id: "pagamentos", label: "Pagamentos" },
  { id: "conta", label: "Conta" },
] as const;

export default async function VendorSettingsPage() {
  await redirectIfVendorOnboardingPending("/vendor/configuracoes");

  const [settings, recipient, braspress] = await Promise.all([
    getVendorSettings(),
    getVendorRecipient(),
    getVendorBraspress(),
  ]);

  return (
    <div className="space-y-5 md:space-y-6">
      <VendorPageHeader
        description="O prazo que sua loja promete, o recebedor que autoriza suas vendas e o acesso ao painel."
        eyebrow="Operação da loja"
        signal={vendorSignal(recipient)}
        title="Configurações"
      />

      <AnchoredSectionNav
        className="-mx-4 top-33.75 px-4 md:-mx-7 md:px-7 lg:top-18.5"
        sections={SECTIONS}
      />

      <VendorLeadTimeSection
        configured={settings.shippingLeadTimeConfigured}
        initialLeadTimeDays={settings.shippingLeadTimeDays}
        loadFailed={settings.loadFailed}
      />
      <VendorBraspressSection initialIntegration={braspress} />
      <VendorRecipientPanel initialRecipient={recipient} />
      <VendorAccountSection />
    </div>
  );
}
