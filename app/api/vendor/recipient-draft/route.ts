import { NextResponse } from "next/server";

import { wpRest } from "@/lib/server/wp-rest";

import { requireVendorAccessToken } from "../_lib/require-vendor-session";

export async function GET() {
  const auth = await requireVendorAccessToken();

  if ("error" in auth) {
    return NextResponse.json({ message: auth.error }, { status: auth.status });
  }

  const result = await wpRest("/papelito/v1/vendor/recipient-draft", {
    headers: {
      Authorization: `Bearer ${auth.accessToken}`,
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

  return NextResponse.json(result.data);
}

export async function POST(request: Request) {
  const auth = await requireVendorAccessToken();

  if ("error" in auth) {
    return NextResponse.json({ message: auth.error }, { status: auth.status });
  }

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;

  if (!body) {
    return NextResponse.json({ message: "Payload invalido." }, { status: 400 });
  }

  const result = await wpRest("/papelito/v1/vendor/recipient-draft", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${auth.accessToken}`,
    },
    json: body,
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

  return NextResponse.json(result.data);
}
