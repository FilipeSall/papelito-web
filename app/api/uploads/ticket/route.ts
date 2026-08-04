import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { getAdminApiSession } from "@/lib/server/admin-api-auth";
import { getUserApiSession } from "@/lib/server/company-api";
import { wpRest } from "@/lib/server/wp-rest";

const APPLICATION_COOKIE = "__Host-papelito_application";

const UPLOAD_PURPOSES = [
  "catalog",
  "media",
  "owner-document",
  "pre-account-document",
] as const;

type UploadPurpose = (typeof UPLOAD_PURPOSES)[number];

type UploadTicket = {
  expiresAt: string;
  ticket: string;
  uploadUrl: string;
};

function isUploadPurpose(value: unknown): value is UploadPurpose {
  return typeof value === "string" && UPLOAD_PURPOSES.includes(value as UploadPurpose);
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { purpose?: unknown } | null;
  const purpose = body?.purpose;

  if (!isUploadPurpose(purpose)) {
    return NextResponse.json({ message: "Finalidade de upload inválida." }, { status: 422 });
  }

  let headers: Record<string, string> = {};

  if (purpose === "media" || purpose === "catalog") {
    const auth = await getAdminApiSession();
    if ("error" in auth) {
      return NextResponse.json({ message: auth.error }, { status: auth.status });
    }
    headers = { Authorization: `Bearer ${auth.accessToken}` };
  } else if (purpose === "owner-document") {
    const auth = await getUserApiSession();
    if ("error" in auth) {
      return NextResponse.json({ message: auth.error }, { status: auth.status });
    }
    headers = { Authorization: `Bearer ${auth.accessToken}` };
  } else {
    const applicationToken = (await cookies()).get(APPLICATION_COOKIE)?.value;
    if (!applicationToken) {
      return NextResponse.json({ message: "Candidatura não encontrada." }, { status: 404 });
    }
    headers = { "X-Papelito-Application-Token": applicationToken };
  }

  const result = await wpRest<UploadTicket>("/papelito/v1/uploads/tickets", {
    headers,
    json: { purpose },
    method: "POST",
  });

  if (!result.ok) {
    return NextResponse.json({ message: result.error.message }, { status: result.status || 502 });
  }

  return NextResponse.json(result.data, { status: result.status });
}
