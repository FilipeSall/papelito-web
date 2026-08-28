import {
  GA4_CURRENCY,
  sumItemsValue,
  type Ga4EcommerceEventName,
  type Ga4Item,
} from "./ga4-ecommerce";

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
  }
}

/**
 * Publica um evento de ecommerce no `dataLayer` que o GTM escuta.
 *
 * São duas mensagens distintas, publicadas em ordem, e isso é contrato com o GTM — não estilo. O
 * `dataLayer` acumula objetos em vez de substituir, então sem a mensagem de reset os `items` do
 * evento anterior vazam para o próximo e o relatório mostra produto que o usuário nunca viu.
 * Fundi-las num único `push(a, b)` dependeria de como o GTM trata múltiplos argumentos depois de
 * substituir `push` em tempo de execução, que é justamente o que a documentação do GA4 não promete.
 */
export function pushEcommerceEvent(
  event: Ga4EcommerceEventName,
  items: readonly Ga4Item[],
): void {
  if (typeof window === "undefined" || items.length === 0) {
    return;
  }

  const dataLayer = window.dataLayer ?? [];
  window.dataLayer = dataLayer;

  const messages: Record<string, unknown>[] = [
    { ecommerce: null },
    {
      event,
      ecommerce: {
        currency: GA4_CURRENCY,
        value: sumItemsValue(items),
        items: [...items],
      },
    },
  ];

  for (const message of messages) {
    dataLayer.push(message);
  }
}
