import { NextResponse } from "next/server";

import { wpRest } from "@/lib/server/wp-rest";

type RegisterPayload = {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  store_name: string;
  phone_number: string;
  cnpj: string;
  cep: string;
  state: string;
  city: string;
  instagram?: string;
};

type WpAuthResponse = {
  authToken: string;
  refreshToken: string;
  user: {
    databaseId: number;
    email: string;
    firstName?: string;
    lastName?: string;
  };
  profileComplete: boolean;
};

export async function POST(request: Request) {
  let body: RegisterPayload;

  try {
    body = (await request.json()) as RegisterPayload;
  } catch {
    return NextResponse.json({ code: "invalid_json", message: "JSON inválido." }, { status: 400 });
  }

  const result = await wpRest<WpAuthResponse>("/papelito/v1/auth/register", { json: body });

  if (!result.ok) {
    return NextResponse.json(result.error, { status: result.status });
  }

  return NextResponse.json({ ok: true, email: body.email }, { status: 201 });
}
