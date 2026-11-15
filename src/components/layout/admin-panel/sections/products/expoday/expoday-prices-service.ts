import type { ExpoPricesPublishPayload, ExpoPricesSnapshot } from "@/features/expocannabis/types/admin-prices";
import { parseExpoPricesSnapshot } from "@/features/expocannabis/utils/parse-admin-prices";
import { isRecord, str } from "@/features/expocannabis/utils/parse-helpers";

const PUBLISH_FAILED = "Não foi possível publicar os preços do evento. Tente de novo.";

function messageFrom(body: unknown): string {
  return (isRecord(body) ? str(body.message) : null) || PUBLISH_FAILED;
}

/**
 * Publica os preços do estande pela rota do admin e devolve a versão nova. Lança `Error` com a
 * mensagem do WordPress quando a publicação é recusada, inclusive quando outra pessoa publicou antes.
 */
export async function publishExpodayPrices(payload: ExpoPricesPublishPayload): Promise<ExpoPricesSnapshot> {
  const response = await fetch("/api/admin/expocannabis/prices", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const body: unknown = await response.json().catch(() => null);
  const snapshot = response.ok && isRecord(body) ? parseExpoPricesSnapshot(body.snapshot) : null;

  if (!snapshot) throw new Error(messageFrom(body));
  return snapshot;
}
