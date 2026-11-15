import "server-only";

import { EXPOCANNABIS_EVENT_ID } from "@/features/expocannabis/constants";
import type { ExpoPricesPublishPayload, ExpoPricesSnapshot } from "@/features/expocannabis/types/admin-prices";
import { parseExpoPricesSnapshot } from "@/features/expocannabis/utils/parse-admin-prices";
import { wpRest } from "@/lib/server/wp-rest";

const PRICES_PATH = `/papelito/v1/event/${EXPOCANNABIS_EVENT_ID}/admin/prices`;
const MALFORMED_MESSAGE = "O WordPress devolveu os preços do evento num formato inesperado.";

/** Falha ao publicar os preços do evento, com o status do WordPress (409 = outra pessoa publicou). */
export class ExpodayPricesRequestError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ExpodayPricesRequestError";
    this.status = status;
  }
}

/**
 * Preços, Kit Premium e vendas do estande para a aba ExpoDay. O WordPress é a autoridade e exige
 * `manage_options`; a leitura é `no-store` porque as vendas mudam a cada pagamento. Devolve `null`
 * sem token, em erro ou com resposta malformada.
 */
export async function getAdminExpodayPrices(accessToken: string | undefined): Promise<ExpoPricesSnapshot | null> {
  if (!accessToken) return null;
  const result = await wpRest<unknown>(PRICES_PATH, { headers: { Authorization: `Bearer ${accessToken}` } });
  return result.ok ? parseExpoPricesSnapshot(result.data) : null;
}

/**
 * Publica os preços do evento e devolve a versão nova. Lança {@link ExpodayPricesRequestError} com
 * a mensagem do WordPress quando ele recusa, inclusive no conflito de versão.
 */
export async function publishAdminExpodayPrices(accessToken: string, payload: ExpoPricesPublishPayload): Promise<ExpoPricesSnapshot> {
  const result = await wpRest<unknown>(PRICES_PATH, {
    headers: { Authorization: `Bearer ${accessToken}` },
    json: payload,
    method: "PUT",
  });

  if (!result.ok) throw new ExpodayPricesRequestError(result.error.message, result.status);

  const snapshot = parseExpoPricesSnapshot(result.data);
  if (!snapshot) throw new ExpodayPricesRequestError(MALFORMED_MESSAGE, 502);
  return snapshot;
}
