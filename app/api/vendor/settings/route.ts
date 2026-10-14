import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

import { normalizeBraspressIntegration } from "@/features/vendor-settings/utils/braspress-integration-payload";
import { wpRest } from "@/lib/server/wp-rest";

import { requireVendorAccessToken } from "../_lib/require-vendor-session";

type SettingsBody = {
  correios_enabled?: unknown;
  shipping_lead_time_days?: unknown;
};

type SettingsChanges = {
  correios_enabled?: boolean;
  shipping_lead_time_days?: number;
};

const LEAD_TIME_MESSAGE = "Informe um prazo inteiro entre 1 e 30 dias uteis.";

function isLeadTime(value: unknown): value is number {
  return Number.isInteger(value) && Number(value) >= 1 && Number(value) <= 30;
}

/**
 * Repassa ao WordPress só os campos enviados, já com o tipo conferido.
 *
 * A gravação é parcial porque prazo e Correios saem de telas diferentes; a
 * regra dos Correios em si é do WordPress, que recusa o que ela proíbe.
 */
function settingsChanges(body: SettingsBody | null): SettingsChanges | string {
  const changes: SettingsChanges = {};

  if (body?.shipping_lead_time_days !== undefined) {
    if (!isLeadTime(body.shipping_lead_time_days)) return LEAD_TIME_MESSAGE;
    changes.shipping_lead_time_days = body.shipping_lead_time_days;
  }

  if (body?.correios_enabled !== undefined) {
    if (typeof body.correios_enabled !== "boolean") return "Informe se os Correios ficam habilitados.";
    changes.correios_enabled = body.correios_enabled;
  }

  return Object.keys(changes).length > 0 ? changes : "Nenhuma configuração foi enviada.";
}

/**
 * Normaliza a Braspress que o WordPress devolve junto quando a escrita mexeu nos Correios.
 *
 * Desligar os Correios pode ligar a Braspress e sondar a credencial; a tela só
 * mostra a recusa se receber a integração no mesmo formato da rota da Braspress.
 */
function settingsResponse(data: unknown) {
  if (typeof data !== "object" || data === null || !("braspress" in data)) return data;

  return { ...data, braspress: normalizeBraspressIntegration((data as { braspress: unknown }).braspress) };
}

export async function PUT(request: Request) {
  const auth = await requireVendorAccessToken();

  if ("error" in auth) {
    return NextResponse.json({ message: auth.error }, { status: auth.status });
  }

  const body = (await request.json().catch(() => null)) as SettingsBody | null;
  const changes = settingsChanges(body);

  if (typeof changes === "string") {
    return NextResponse.json({ message: changes }, { status: 400 });
  }

  const result = await wpRest<unknown>("/papelito/v1/vendor/me/settings", {
    method: "PUT",
    headers: { Authorization: `Bearer ${auth.accessToken}` },
    json: changes,
  });

  if (!result.ok) {
    return NextResponse.json({ message: result.error.message, code: result.error.code }, { status: result.status || 502 });
  }

  revalidateTag("vendor-settings", "max");
  revalidateTag("vendor-braspress", "max");
  revalidatePath("/vendor/configuracoes");
  revalidatePath("/perfil/configuracoes");
  return NextResponse.json(settingsResponse(result.data));
}
