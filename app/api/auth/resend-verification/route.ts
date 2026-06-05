import { NextResponse } from "next/server";

import { wpRest } from "@/lib/server/wp-rest";

type ResendVerificationPayload = {
  email: string;
};

type ResendVerificationResponse = {
  ok: true;
};

export async function POST(request: Request) {
  let body: ResendVerificationPayload;

  try {
    body = (await request.json()) as ResendVerificationPayload;
  } catch {
    return NextResponse.json({ code: "invalid_json", message: "JSON inválido." }, { status: 400 });
  }

  const result = await wpRest<ResendVerificationResponse>("/papelito/v1/auth/resend-verification", {
    json: body,
  });

  if (!result.ok) {
    return NextResponse.json(result.error, { status: result.status });
  }

  return NextResponse.json(result.data, { status: 200 });
}
