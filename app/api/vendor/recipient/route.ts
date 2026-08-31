import { NextResponse } from "next/server";

import { wpRest } from "@/lib/server/wp-rest";

import { requireVendorAccessToken } from "../_lib/require-vendor-session";

type VendorRecipientResponse = {
  recipient_id?: string;
  status?: string;
  last_sync_at?: string;
  kyc_url?: string;
  last_error?: string;
  last_error_code?: string;
};

function mapVendorRecipientResponse(payload: unknown) {
  const body =
    payload && typeof payload === "object"
      ? (payload as VendorRecipientResponse)
      : {};

  return {
    recipient_id: body.recipient_id || "",
    status: body.status || "",
    last_sync_at: body.last_sync_at || "",
    kyc_url: body.kyc_url || "",
    last_error: body.last_error || "",
    last_error_code: body.last_error_code || "",
  };
}

export async function POST(request: Request) {
  const auth = await requireVendorAccessToken();

  if ("error" in auth) {
    return NextResponse.json({ message: auth.error }, { status: auth.status });
  }

  const body = (await request.json().catch(() => null)) as
    | { refresh_kyc?: boolean }
    | null;

  const result = await wpRest("/papelito/v1/vendor/recipient", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${auth.accessToken}`,
    },
    json: {
      refresh_kyc: Boolean(body?.refresh_kyc),
    },
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

  return NextResponse.json(mapVendorRecipientResponse(result.data));
}
