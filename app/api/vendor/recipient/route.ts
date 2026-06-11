import { NextResponse } from "next/server";

import { wpRest } from "@/lib/server/wp-rest";

import { requireVendorAccessToken } from "../_lib/require-vendor-session";

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
      { message: result.error.message, code: result.error.code },
      { status: result.status || 500 },
    );
  }

  return NextResponse.json(result.data);
}
