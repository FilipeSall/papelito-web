import type { ShippingProvider } from "@/features/checkout/types/checkout";

const PROVIDER_LABEL: Record<ShippingProvider, string> = {
  correios: "Correios",
  braspress: "Braspress",
};

const PROVIDER_ARTICLE: Record<ShippingProvider, string> = {
  correios: "os",
  braspress: "a",
};

/**
 * Nome comercial da transportadora para o customer. Opção persistida antes do
 * contrato multicarrier não traz `provider`, e nesse caso só pode ser Correios —
 * era a única transportadora que existia quando aquele estado foi gravado.
 */
export function shippingProviderLabel(provider: ShippingProvider | undefined): string {
  return PROVIDER_LABEL[provider ?? "correios"];
}

/**
 * Nome da transportadora com o artigo definido, para a frase em que ele é
 * obrigatório: "Acompanhando **a** Braspress", "Acompanhando **os** Correios".
 *
 * Correios é plural e Braspress é singular; sem o artigo por transportadora, a
 * mesma frase erra a concordância em uma das duas. Onde a preposição também
 * contrai ("pelos"/"pela"), a frase inteira varia por transportadora — este
 * helper não resolve esse caso.
 */
export function shippingProviderWithArticle(provider: ShippingProvider | undefined): string {
  const resolved = provider ?? "correios";

  return `${PROVIDER_ARTICLE[resolved]} ${PROVIDER_LABEL[resolved]}`;
}
