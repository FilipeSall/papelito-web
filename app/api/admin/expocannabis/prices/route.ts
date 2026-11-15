import { NextResponse } from "next/server";

import type { ExpoPricesPublishPayload } from "@/features/expocannabis/types/admin-prices";
import { isRecord } from "@/features/expocannabis/utils/parse-helpers";
import { getAdminApiSession } from "@/lib/server/admin-api-auth";
import { ExpodayPricesRequestError, publishAdminExpodayPrices } from "@/lib/server/admin-expoday-prices";

const INVALID_PAYLOAD = "Os preços enviados vieram num formato inválido.";
const PUBLISH_FAILED = "Não foi possível publicar os preços do evento.";
const WORDPRESS_UNREACHABLE = "Não foi possível falar com o WordPress. Tente publicar de novo.";
const BAD_GATEWAY = 502;

function isHttpErrorStatus(status: number): boolean {
  return Number.isInteger(status) && status >= 400 && status <= 599;
}

/**
 * Status e mensagem da falha. Falha de transporte do `wpRest` chega com status 0, que o
 * `NextResponse` recusa: vira 502 com mensagem própria.
 */
function failureOf(error: unknown): { message: string; status: number } {
  if (error instanceof ExpodayPricesRequestError && !isHttpErrorStatus(error.status)) {
    return { message: WORDPRESS_UNREACHABLE, status: BAD_GATEWAY };
  }
  if (error instanceof ExpodayPricesRequestError) {
    return { message: error.message || PUBLISH_FAILED, status: error.status };
  }
  return { message: PUBLISH_FAILED, status: 500 };
}

function isIntegerRecord(value: unknown): value is Record<string, number> {
  return isRecord(value) && Object.values(value).every((cents) => Number.isInteger(cents));
}

function readPayload(value: unknown): ExpoPricesPublishPayload | null {
  if (!isRecord(value)) return null;
  const { kitPctOff, prices, version } = value;
  if (!Number.isInteger(version) || !Number.isInteger(kitPctOff) || !isIntegerRecord(prices)) return null;
  return { version: version as number, prices, kitPctOff: kitPctOff as number };
}

/**
 * `PUT /api/admin/expocannabis/prices`: publica os preços do estande. Só administrador; o
 * WordPress revalida produtos, valores e a versão aberta.
 */
export async function PUT(request: Request) {
  const auth = await getAdminApiSession();
  if ("error" in auth) return NextResponse.json({ message: auth.error }, { status: auth.status });

  const payload = readPayload(await request.json().catch(() => null));
  if (!payload) return NextResponse.json({ message: INVALID_PAYLOAD }, { status: 400 });

  try {
    const snapshot = await publishAdminExpodayPrices(auth.accessToken, payload);
    return NextResponse.json({ snapshot });
  } catch (error) {
    const { message, status } = failureOf(error);
    return NextResponse.json({ message }, { status });
  }
}
