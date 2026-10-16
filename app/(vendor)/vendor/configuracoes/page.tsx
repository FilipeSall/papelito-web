import { redirect } from "next/navigation";

import {
  VendorAccountSection,
  VendorBraspressSection,
  VendorFinancialProfileForm,
  VendorLeadTimeSection,
  VendorPageHeader,
  VendorPaymentGatewaysPanel,
  VendorRecipientPanel,
} from "@/components/layout/vendor-panel";
import { AnchoredSectionNav } from "@/components/ui/anchored-sections";
import { getVendorPendingRegistrationState } from "@/features/revendedor/server/vendor-onboarding";
import { buildVendorOnboardingHref } from "@/features/revendedor/utils/vendor-onboarding";
import {
  getVendorFinancialProfile,
  getVendorPaymentGateways,
} from "@/features/vendor-payment-gateways/services/get-vendor-payment-gateways";
import type { VendorPaymentSummary } from "@/features/vendor-payment-gateways/types/payment-gateways";
import { vendorPaymentSignal } from "@/features/vendor-payment-gateways/utils/gateway-display";
import { getVendorRecipient } from "@/features/vendor-recipient/services/get-vendor-recipient";
import { getVendorBraspress, getVendorSettings } from "@/features/vendor-settings/server";
import { firstParam } from "@/lib/search-params";

const SETTINGS_PATH = "/vendor/configuracoes";

const SECTIONS = [
  { id: "entrega", label: "Entrega" },
  { id: "transportadoras", label: "Transportadoras" },
  { id: "pagamentos", label: "Pagamentos" },
  { id: "conta", label: "Conta" },
] as const;

type VendorSettingsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function usesGateways(summary: VendorPaymentSummary | null): summary is VendorPaymentSummary {
  return summary !== null && summary.mode !== "legacy";
}

export default async function VendorSettingsPage({ searchParams }: Readonly<VendorSettingsPageProps>) {
  const registration = await getVendorPendingRegistrationState();

  if (registration.pendingFields.length > 0) {
    redirect(buildVendorOnboardingHref(SETTINGS_PATH));
  }

  const [settings, recipient, braspress, paymentSummary] = await Promise.all([
    getVendorSettings(),
    getVendorRecipient(),
    getVendorBraspress(),
    getVendorPaymentGateways(),
  ]);
  const params = (await searchParams) ?? {};
  const gatewaysMode = usesGateways(paymentSummary);
  const financialProfile = gatewaysMode ? await getVendorFinancialProfile() : null;

  return (
    <div className="space-y-5 md:space-y-6">
      <VendorPageHeader
        description={
          gatewaysMode
            ? "O prazo que sua loja promete, os gateways que recebem suas vendas e o acesso ao painel."
            : "O prazo que sua loja promete, o recebedor que autoriza suas vendas e o acesso ao painel."
        }
        eyebrow="Operação da loja"
        signal={vendorPaymentSignal(paymentSummary, recipient)}
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
      <VendorBraspressSection
        correiosLoadFailed={settings.loadFailed}
        initialCorreios={settings.correios}
        initialIntegration={braspress}
      />
      {gatewaysMode ? (
        <VendorPaymentGatewaysPanel
          initialSummary={paymentSummary}
          oauthOutcome={firstParam(params.mercadopago)}
          oauthReason={firstParam(params.reason)}
        >
          <VendorFinancialProfileForm
            cnpj={registration.application?.step1.cnpj ?? ""}
            initialProfile={financialProfile}
          />
        </VendorPaymentGatewaysPanel>
      ) : (
        <VendorRecipientPanel initialRecipient={recipient} />
      )}
      <VendorAccountSection />
    </div>
  );
}
