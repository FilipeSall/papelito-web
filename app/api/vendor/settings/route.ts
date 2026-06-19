import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

import { wpRest } from "@/lib/server/wp-rest";

import { requireVendorAccessToken } from "../_lib/require-vendor-session";

export async function PUT(request: Request) {
  const auth = await requireVendorAccessToken();

  if ("error" in auth) {
    return NextResponse.json({ message: auth.error }, { status: auth.status });
  }

  const body = (await request.json().catch(() => null)) as
    | { shipping_lead_time_days?: number }
    | null;
  const days = body?.shipping_lead_time_days;

  if (!Number.isInteger(days) || Number(days) < 1 || Number(days) > 30) {
    return NextResponse.json({ message: "Informe um prazo inteiro entre 1 e 30 dias uteis." }, { status: 400 });
  }

  const result = await wpRest<unknown>("/papelito/v1/vendor/me/settings", {
    method: "PUT",
    headers: { Authorization: `Bearer ${auth.accessToken}` },
    json: { shipping_lead_time_days: days },
  });

  if (!result.ok) {
    return NextResponse.json({ message: result.error.message, code: result.error.code }, { status: result.status || 502 });
  }

  revalidateTag("vendor-settings", "max");
  revalidatePath("/vendor/configuracoes");
  revalidatePath("/perfil/configuracoes");
  return NextResponse.json(result.data);
}
