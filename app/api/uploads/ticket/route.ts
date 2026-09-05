import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { getAdminApiSession } from "@/lib/server/admin-api-auth";
import { getUserApiSession } from "@/lib/server/company-api";
import { wpRest } from "@/lib/server/wp-rest";

import { requireVendorAccessToken } from "../../vendor/_lib/require-vendor-session";

const APPLICATION_COOKIE = "__Host-papelito_application";

const UPLOAD_PURPOSES = [
  "catalog",
  "media",
  "owner-document",
  "pre-account-document",
  "vendor-fiscal-document",
] as const;

const FISCAL_ROLES = new Set(["danfe_pdf", "xml"]);

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
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const purpose = body?.purpose;

  if (!isUploadPurpose(purpose)) {
    return NextResponse.json({ message: "Finalidade de upload inválida." }, { status: 422 });
  }

  let headers: Record<string, string> = {};
  let json: Record<string, unknown> = { purpose };

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
  } else if (purpose === "vendor-fiscal-document") {
    const auth = await requireVendorAccessToken();
    if ("error" in auth) {
      return NextResponse.json({ message: auth.error }, { status: auth.status });
    }

    const orderId = Number(body?.orderId);
    const role = body?.role;

    // O pedido e o papel entram no tíquete; a autorização real — pedido do
    // vendor e situação que aceita nota — continua sendo do WordPress.
    if (!Number.isInteger(orderId) || orderId <= 0 || typeof role !== "string" || !FISCAL_ROLES.has(role)) {
      return NextResponse.json({ message: "Anexo de nota fiscal inválido." }, { status: 422 });
    }

    headers = { Authorization: `Bearer ${auth.accessToken}` };
    json = {
      declared: typeof body?.declared === "object" && body.declared !== null ? body.declared : {},
      mode: body?.mode === "replace" ? "replace" : "attach",
      orderId,
      purpose,
      role,
    };
  } else {
    const applicationToken = (await cookies()).get(APPLICATION_COOKIE)?.value;
    if (!applicationToken) {
      return NextResponse.json({ message: "Candidatura não encontrada." }, { status: 404 });
    }
    headers = { "X-Papelito-Application-Token": applicationToken };
  }

  const result = await wpRest<UploadTicket>("/papelito/v1/uploads/tickets", {
    headers,
    json,
    method: "POST",
  });

  if (!result.ok) {
    return NextResponse.json({ message: result.error.message }, { status: result.status || 502 });
  }

  return NextResponse.json(result.data, { status: result.status });
}
