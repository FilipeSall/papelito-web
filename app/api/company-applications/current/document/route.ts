import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { wpRest } from "@/lib/server/wp-rest";

const APPLICATION_COOKIE = "__Host-papelito_application";

export async function POST(request: Request) {
  const token = (await cookies()).get(APPLICATION_COOKIE)?.value;
  if (!token) return NextResponse.json({ message: "Candidatura não encontrada." }, { status: 404 });
  const formData = await request.formData().catch(() => null);
  const document = formData?.get("document");
  if (!(document instanceof File)) return NextResponse.json({ message: "Selecione um documento válido." }, { status: 422 });

  const outgoing = new FormData();
  outgoing.set("document", document, document.name);
  const result = await wpRest("/papelito/v1/company-applications/current/document", {
    method: "POST",
    headers: { "X-Papelito-Application-Token": token },
    body: outgoing,
  });
  return result.ok
    ? NextResponse.json(result.data, { status: result.status, headers: { "Cache-Control": "no-store" } })
    : NextResponse.json(result.error, { status: result.status || 502 });
}
