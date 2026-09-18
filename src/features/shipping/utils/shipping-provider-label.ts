import type { ShippingProvider } from "@/features/checkout/types/checkout";

const PROVIDER_LABEL: Record<ShippingProvider, string> = {
  correios: "Correios",
  braspress: "Braspress",
};

/**
 * Nome comercial da transportadora para o customer. Opção persistida antes do
 * contrato multicarrier não traz `provider`, e nesse caso só pode ser Correios —
 * era a única transportadora que existia quando aquele estado foi gravado.
 */
export function shippingProviderLabel(provider: ShippingProvider | undefined): string {
  return PROVIDER_LABEL[provider ?? "correios"];
}
