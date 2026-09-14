import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

import { wpRest } from "@/lib/server/wp-rest";

import { requireVendorAccessToken } from "../_lib/require-vendor-session";

function stringValue(value: unknown) {
  return typeof value === "string" ? value : "";
}

function publicIntegration(value: unknown) {
  const integration = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  const config = integration.config && typeof integration.config === "object"
    ? (integration.config as Record<string, unknown>)
    : {};
  const status = integration.status;

  return {
    provider: "braspress" as const,
    enabled: integration.enabled === true || integration.enabled === 1,
    status:
      status === "ready" || status === "active" || status === "invalid_credentials"
        ? status
        : "unconfigured",
    configurationVersion: Number(integration.configuration_version) || 0,
    configured: integration.configured === true,
    credentialsConfigured: integration.credentials_configured === true,
    config: {
      senderCnpj: stringValue(config.sender_cnpj),
      originCep: stringValue(config.origin_cep),
      modal: stringValue(config.modal),
      freightType: stringValue(config.freight_type),
      consigneeCnpj: stringValue(config.consignee_cnpj),
      weightUnit: stringValue(config.weight_unit),
      quoteTimezone: stringValue(config.quote_timezone),
      trackingTomadorCnpj: stringValue(config.tracking_tomador_cnpj),
    },
  };
}

async function mutate(request: Request, method: "PUT" | "DELETE") {
  const auth = await requireVendorAccessToken();

  if ("error" in auth) {
    return NextResponse.json({ message: auth.error }, { status: auth.status });
  }

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body || typeof body !== "object") {
    return NextResponse.json({ message: "Dados inválidos." }, { status: 400 });
  }

  const result = await wpRest<unknown>("/papelito/v1/vendor/me/integrations/braspress", {
    method,
    headers: { Authorization: `Bearer ${auth.accessToken}` },
    json: body,
  });

  if (!result.ok) {
    return NextResponse.json(
      { message: result.error.message, code: result.error.code },
      { status: result.status || 502 },
    );
  }

  revalidateTag("vendor-braspress", "max");
  revalidatePath("/vendor/configuracoes");
  return NextResponse.json(publicIntegration(result.data));
}

export async function PUT(request: Request) {
  return mutate(request, "PUT");
}

export async function DELETE(request: Request) {
  return mutate(request, "DELETE");
}
