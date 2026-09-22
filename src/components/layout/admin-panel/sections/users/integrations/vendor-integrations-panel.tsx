import type { AdminVendorIntegrations } from "@/lib/server/admin-vendor-integrations";

import { EmptyStateCard } from "../../../primitives";

import { BraspressIntegrationCard } from "./braspress-integration-card";

/**
 * Integrações externas de um vendor, uma por provedor conhecido.
 *
 * O backend devolve uma entrada por provedor do catálogo mesmo quando o vendor
 * nunca configurou nenhuma, então esta lista é o ponto onde uma segunda
 * transportadora entra sem que a aba precise ser reescrita: basta o cartão do
 * novo provedor. Hoje só a Braspress tem configuração por vendor.
 */
export function VendorIntegrationsPanel({
  integrations,
  vendorId,
  vendorName,
}: Readonly<{
  integrations: AdminVendorIntegrations;
  vendorId: number;
  vendorName: string;
}>) {
  if (integrations.loadFailed) {
    return (
      <EmptyStateCard
        body="Não foi possível ler as integrações desta loja. Recarregue a página antes de alterar qualquer dado."
        label="Integrações"
        title="Estado não lido"
      />
    );
  }

  if (integrations.items.length === 0) {
    return (
      <EmptyStateCard
        body="Nenhuma integração externa está disponível para esta loja."
        label="Integrações"
        title="Sem integrações"
      />
    );
  }

  return (
    <div className="grid gap-5">
      {integrations.items.map((integration) => (
        <BraspressIntegrationCard
          key={integration.provider}
          integration={integration}
          vendorId={vendorId}
          vendorName={vendorName}
        />
      ))}
    </div>
  );
}
