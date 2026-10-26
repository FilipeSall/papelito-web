import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { APPLICATION_COOKIE } from "@/lib/server/company-application-cookie";
import { getAdminApiSession } from "@/lib/server/admin-api-auth";
import { getUserApiSession } from "@/lib/server/company-api";
import { wpRest } from "@/lib/server/wp-rest";

import { requireVendorAccessToken } from "../../vendor/_lib/require-vendor-session";


const UPLOAD_PURPOSES = [
  "catalog",
  "media",
  "owner-document",
  "pre-account-document",
  "vendor-fiscal-document",
  "return-refund-proof",
  "order-refund-proof",
  "vendor-sku-import",
  "admin-product-import",
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

type TicketRequest =
  | { headers: Record<string, string>; json: Record<string, unknown> }
  | { response: NextResponse };

type SessionResult = { accessToken: string } | { error: string; status: number };

const VENDOR_RECORD_PURPOSES = new Set<UploadPurpose>(["vendor-fiscal-document", "return-refund-proof", "order-refund-proof"]);

function denied(message: string, status: number): TicketRequest {
  return { response: NextResponse.json({ message }, { status }) };
}

async function bearerTicket(load: () => Promise<SessionResult>, json: Record<string, unknown>): Promise<TicketRequest> {
  const auth = await load();
  if ("error" in auth) return denied(auth.error, auth.status);
  return { headers: { Authorization: `Bearer ${auth.accessToken}` }, json };
}

async function vendorRecordTicket(purpose: UploadPurpose, body: Record<string, unknown> | null): Promise<TicketRequest> {
  const auth = await requireVendorAccessToken();
  if ("error" in auth) return denied(auth.error, auth.status);

  const id = Number(purpose === "return-refund-proof" ? body?.returnId : body?.orderId);

  // O pedido entra no tíquete; a autorização real — pedido do vendor e
  // situação que aceita nota — continua sendo do WordPress. O upload sempre
  // substitui a nota que houver, então não há modo a escolher.
  if (!Number.isInteger(id) || id <= 0) {
    return denied(purpose === "vendor-fiscal-document" ? "Anexo de nota fiscal inválido." : "Comprovante de estorno inválido.", 422);
  }

  return {
    headers: { Authorization: `Bearer ${auth.accessToken}` },
    json: purpose === "return-refund-proof" ? { returnId: id, purpose } : { orderId: id, purpose },
  };
}

async function applicationTicket(purpose: UploadPurpose): Promise<TicketRequest> {
  const applicationToken = (await cookies()).get(APPLICATION_COOKIE)?.value;
  if (!applicationToken) return denied("Candidatura não encontrada.", 404);
  return { headers: { "X-Papelito-Application-Token": applicationToken }, json: { purpose } };
}

function resolveTicketRequest(purpose: UploadPurpose, body: Record<string, unknown> | null): Promise<TicketRequest> {
  if (purpose === "media" || purpose === "catalog" || purpose === "admin-product-import") {
    return bearerTicket(getAdminApiSession, { purpose });
  }
  if (purpose === "owner-document") return bearerTicket(getUserApiSession, { purpose });
  if (purpose === "vendor-sku-import") return bearerTicket(requireVendorAccessToken, { purpose });
  if (VENDOR_RECORD_PURPOSES.has(purpose)) return vendorRecordTicket(purpose, body);
  return applicationTicket(purpose);
}

/**
 * Emite o tíquete de upload direto ao WordPress para uma finalidade.
 * Cada finalidade autentica pelo seu canal; a permissão real é decidida pelo WordPress na emissão.
 */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const purpose = body?.purpose;

  if (!isUploadPurpose(purpose)) {
    return NextResponse.json({ message: "Finalidade de upload inválida." }, { status: 422 });
  }

  const ticketRequest = await resolveTicketRequest(purpose, body);
  if ("response" in ticketRequest) return ticketRequest.response;

  const result = await wpRest<UploadTicket>("/papelito/v1/uploads/tickets", {
    headers: ticketRequest.headers,
    json: ticketRequest.json,
    method: "POST",
  });

  if (!result.ok) {
    return NextResponse.json({ message: result.error.message }, { status: result.status || 502 });
  }

  return NextResponse.json(result.data, { status: result.status });
}
