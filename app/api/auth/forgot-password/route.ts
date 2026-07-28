import { NextResponse } from "next/server";

import { wpRest } from "@/lib/server/wp-rest";

type ForgotPasswordPayload = {
  email: string;
};

type ForgotPasswordResponse = {
  ok: true;
};

export async function POST(request: Request) {
  let body: ForgotPasswordPayload;

  try {
    body = (await request.json()) as ForgotPasswordPayload;
  } catch {
    return NextResponse.json({ code: "invalid_json", message: "JSON inválido." }, { status: 400 });
  }

  const result = await wpRest<ForgotPasswordResponse>("/papelito/v1/auth/forgot-password", {
    json: body,
  });

  if (!result.ok) {
    return NextResponse.json(result.error, { status: result.status });
  }

  return NextResponse.json(result.data, { status: 200 });
}
