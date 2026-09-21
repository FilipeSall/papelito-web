import type { ShippingProvider } from "@/features/checkout/types/checkout";

/**
 * Transportadoras que o contrato multicarrier reconhece.
 *
 * Existe para que acrescentar uma transportadora a `ShippingProvider` **quebre
 * a compilação aqui**: o `Record` exige a chave nova. Sem isso o resolvedor
 * degradaria a transportadora recém-criada para Correios em silêncio, que é o
 * sintoma que esta entrega corrigiu.
 */
export const SHIPPING_PROVIDERS: Record<ShippingProvider, true> = {
  braspress: true,
  correios: true,
};

/**
 * Traduz a transportadora gravada no pedido ou na remessa para o provider do
 * contrato multicarrier.
 *
 * A coluna `provider` da remessa guarda também o modo de registro (`manual`,
 * `mock`), e registro nasceu do S10, que é código dos Correios. Registro sem
 * provider vem de antes do contrato multicarrier, quando Correios era a única
 * transportadora — por isso tudo que o contrato não reconhece é lido como
 * Correios, e nunca o contrário: errar para o lado da Braspress prometeria uma
 * pré-postagem que ela não emite.
 */
export function resolveShippingProvider(provider: string | undefined): ShippingProvider {
  return provider && provider in SHIPPING_PROVIDERS ? (provider as ShippingProvider) : "correios";
}
