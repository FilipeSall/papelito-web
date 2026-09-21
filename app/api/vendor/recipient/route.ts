import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

import { wpRest } from "@/lib/server/wp-rest";

import { requireVendorAccessToken } from "../_lib/require-vendor-session";

type VendorRecipientResponse = {
  recipient_id?: string;
  status?: string;
  kyc_status?: string;
  kyc_status_reason?: string;
  last_sync_at?: string;
  last_error?: string;
  last_error_code?: string;
  last_error_fields?: unknown;
};

function mapVendorRecipientResponse(payload: unknown) {
  const body =
    payload && typeof payload === "object"
      ? (payload as VendorRecipientResponse)
      : {};

  return {
    recipient_id: body.recipient_id || "",
    status: body.status || "",
    kyc_status: body.kyc_status || "",
    kyc_status_reason: body.kyc_status_reason || "",
    last_sync_at: body.last_sync_at || "",
    last_error: body.last_error || "",
    last_error_code: body.last_error_code || "",
    last_error_fields: Array.isArray(body.last_error_fields) ? body.last_error_fields : [],
  };
}

export async function GET() {
  const auth = await requireVendorAccessToken();

  if ("error" in auth) {
    return NextResponse.json({ message: auth.error }, { status: auth.status });
  }

  const result = await wpRest("/papelito/v1/vendor/recipient", {
    headers: {
      Authorization: `Bearer ${auth.accessToken}`,
    },
    cache: "no-store",
  });

  if (!result.ok) {
    return NextResponse.json(
      {
        message: result.error.message,
        code: result.error.code,
      },
      { status: result.status || 500 },
    );
  }

  // Esta leitura consulta a Pagar.me e regrava o estado do recebedor no WordPress, então o
  // veredito de elegibilidade que a casca do painel carregou pode ter acabado de mudar.
  revalidateTag("vendor-eligibility", "max");

  return NextResponse.json(mapVendorRecipientResponse(result.data), {
    headers: { "Cache-Control": "no-store, private" },
  });
}
