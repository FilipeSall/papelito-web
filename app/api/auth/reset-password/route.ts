import { NextResponse } from "next/server";

import { wpRest } from "@/lib/server/wp-rest";

type ResetPasswordPayload = {
  login: string;
  key: string;
  password: string;
  confirmPassword: string;
};

type ResetPasswordResponse = {
  ok: true;
};

export async function POST(request: Request) {
  let body: ResetPasswordPayload;

  try {
    body = (await request.json()) as ResetPasswordPayload;
  } catch {
    return NextResponse.json({ code: "invalid_json", message: "JSON inválido." }, { status: 400 });
  }

  const result = await wpRest<ResetPasswordResponse>("/papelito/v1/auth/reset-password", {
    json: body,
  });

  if (!result.ok) {
    return NextResponse.json(result.error, { status: result.status });
  }

  return NextResponse.json(result.data, { status: 200 });
}
