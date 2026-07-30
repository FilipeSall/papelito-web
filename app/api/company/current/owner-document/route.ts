import { NextResponse } from "next/server";

import { getUserApiSession } from "@/lib/server/company-api";
import { wpRest } from "@/lib/server/wp-rest";

export async function POST(request: Request) {
  const auth = await getUserApiSession();
  if ("error" in auth) {
    return NextResponse.json({ message: auth.error }, { status: auth.status });
  }

  const key = request.headers.get("Idempotency-Key");
  if (!key) {
    return NextResponse.json({ message: "Chave de idempotência ausente." }, { status: 422 });
  }

  const formData = await request.formData().catch(() => null);
  const document = formData?.get("document");
  if (!(document instanceof File)) {
    return NextResponse.json({ message: "Selecione um documento válido." }, { status: 422 });
  }

  const outgoing = new FormData();
  outgoing.set("document", document, document.name);
  const result = await wpRest("/papelito/v1/companies/current/owner-document", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${auth.accessToken}`,
      "Idempotency-Key": key,
    },
    body: outgoing,
  });

  return result.ok
    ? NextResponse.json(result.data, { status: result.status })
    : NextResponse.json(result.error, { status: result.status || 502 });
}
