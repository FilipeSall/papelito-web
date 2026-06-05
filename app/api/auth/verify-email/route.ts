import { NextResponse } from "next/server";

import { wpRest } from "@/lib/server/wp-rest";

type VerifyEmailPayload = {
  email: string;
  token: string;
};

type VerifyEmailResponse = {
  ok: true;
};

export async function POST(request: Request) {
  let body: VerifyEmailPayload;

  try {
    body = (await request.json()) as VerifyEmailPayload;
  } catch {
    return NextResponse.json({ code: "invalid_json", message: "JSON inválido." }, { status: 400 });
  }

  const result = await wpRest<VerifyEmailResponse>("/papelito/v1/auth/verify-email", { json: body });

  if (!result.ok) {
    return NextResponse.json(result.error, { status: result.status });
  }

  return NextResponse.json(result.data, { status: 200 });
}
