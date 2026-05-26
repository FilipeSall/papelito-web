import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    await request.json();
  } catch {
    return NextResponse.json({ code: "invalid_json", message: "JSON inválido." }, { status: 400 });
  }

  return NextResponse.json(
    {
      code: "register_seller_disabled",
      message: "Use o fluxo autenticado em /revendedor para enviar a candidatura de vendor.",
    },
    { status: 410 },
  );
}
