import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

import { normalizeBraspressIntegration } from "@/features/vendor-settings/utils/braspress-integration-payload";
import { readCorreiosPreference } from "@/features/vendor-settings/utils/read-correios-preference";
import { wpRest } from "@/lib/server/wp-rest";

import { requireVendorAccessToken } from "../_lib/require-vendor-session";

function publicIntegration(value: unknown) {
  return { ...normalizeBraspressIntegration(value), correios: readCorreiosPreference(value) };
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
  revalidateTag("vendor-settings", "max");
  revalidatePath("/vendor/configuracoes");
  return NextResponse.json(publicIntegration(result.data));
}

export async function PUT(request: Request) {
  return mutate(request, "PUT");
}

export async function DELETE(request: Request) {
  return mutate(request, "DELETE");
}
