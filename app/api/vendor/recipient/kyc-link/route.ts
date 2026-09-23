import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

import { wpRest } from "@/lib/server/wp-rest";

import { requireVendorAccessToken } from "../../_lib/require-vendor-session";

type KycLinkResponse = {
  url?: string;
  email_sent?: boolean;
  recipient_id?: string;
  status?: string;
  kyc_status?: string;
  kyc_status_reason?: string;
  last_sync_at?: string;
  last_error?: string;
  last_error_code?: string;
};

export async function POST() {
  const auth = await requireVendorAccessToken();

  if ("error" in auth) {
    return NextResponse.json({ message: auth.error }, { status: auth.status });
  }

  const result = await wpRest<KycLinkResponse>("/papelito/v1/vendor/recipient/kyc-link", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${auth.accessToken}`,
    },
    json: {},
    cache: "no-store",
  });

  if (!result.ok) {
    return NextResponse.json(
      { message: result.error.message, code: result.error.code },
      { status: result.status || 500 },
    );
  }

  // A criacao do link de KYC regrava o estado do recebedor no WordPress.
  revalidateTag("vendor-eligibility", "max");
  revalidateTag("vendor-recipient", "max");

  return NextResponse.json(
    {
      url: result.data.url || "",
      emailSent: Boolean(result.data.email_sent),
      recipientId: result.data.recipient_id || "",
      status: result.data.status || "",
      kycStatus: result.data.kyc_status || "",
      kycStatusReason: result.data.kyc_status_reason || "",
      lastSyncAt: result.data.last_sync_at || "",
      lastError: result.data.last_error || "",
      lastErrorCode: result.data.last_error_code || "",
    },
    { headers: { "Cache-Control": "no-store, private" } },
  );
}
