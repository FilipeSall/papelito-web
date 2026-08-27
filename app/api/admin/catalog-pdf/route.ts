import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import type { CatalogPdfSnapshot } from "@/lib/server/catalog-pdf";
import { getAdminApiSession, readWithAdminApiSession } from "@/lib/server/admin-api-auth";
import { getWpRestBase } from "@/lib/server/env";
import { wpRest } from "@/lib/server/wp-rest";

const MAX_CATALOG_SIZE = 10 * 1024 * 1024;

function jsonError(message: string, status: number) {
  return NextResponse.json({ message }, { status });
}

function isPdfSignature(bytes: ArrayBuffer) {
  return Buffer.from(bytes).subarray(0, 5).toString("ascii") === "%PDF-";
}

function isUploadedFile(value: FormDataEntryValue | null): value is File {
  return (
    typeof value === "object" &&
    value !== null &&
    "arrayBuffer" in value &&
    "name" in value &&
    "size" in value &&
    "slice" in value
  );
}

async function validatePdf(file: File) {
  if (file.size <= 0) {
    return "O PDF enviado está vazio.";
  }

  if (file.size > MAX_CATALOG_SIZE) {
    return "O PDF excede o limite de 10 MB.";
  }

  if (!file.name.toLowerCase().endsWith(".pdf")) {
    return "Apenas arquivos PDF são aceitos.";
  }

  if (file.type && file.type !== "application/pdf" && file.type !== "application/x-pdf") {
    return "Apenas arquivos PDF validos são aceitos.";
  }

  const signature = await file.slice(0, 5).arrayBuffer();
  if (!isPdfSignature(signature)) {
    return "O arquivo enviado não possui assinatura PDF válida.";
  }

  return null;
}

async function parseWpResponse(response: Response) {
  return (await response.json().catch(() => null)) as
    | (CatalogPdfSnapshot & { message?: string })
    | { message?: string }
    | null;
}

export async function GET() {
  const session = await readWithAdminApiSession((accessToken) =>
    wpRest<CatalogPdfSnapshot>("/papelito/v1/catalog-pdf-info", {
      cache: "no-store",
      headers: { Authorization: `Bearer ${accessToken}` },
    }),
  );

  if ("error" in session) {
    return jsonError(session.error, session.status);
  }

  const result = session.data;

  if (!result.ok) {
    return jsonError(result.error.message, result.status || 502);
  }

  return NextResponse.json(result.data);
}

export async function POST(request: Request) {
  const auth = await getAdminApiSession();

  if ("error" in auth) {
    return jsonError(auth.error, auth.status);
  }

  const formData = await request.formData().catch(() => null);
  const file = formData?.get("file") ?? null;

  if (!isUploadedFile(file)) {
    return jsonError("Arquivo PDF obrigatório.", 422);
  }

  const validationError = await validatePdf(file);
  if (validationError) {
    return jsonError(validationError, 422);
  }

  const body = new FormData();
  body.append("file", file, file.name);

  const response = await fetch(`${getWpRestBase().replace(/\/$/, "")}/papelito/v1/catalog-pdf`, {
    body,
    cache: "no-store",
    headers: { Authorization: `Bearer ${auth.accessToken}` },
    method: "POST",
  });
  const json = await parseWpResponse(response);

  if (!response.ok) {
    return jsonError(json?.message ?? "Não foi possível enviar o catálogo.", response.status);
  }

  revalidatePath("/revendedor");
  return NextResponse.json(json, { status: 201 });
}

export async function DELETE() {
  const auth = await getAdminApiSession();

  if ("error" in auth) {
    return jsonError(auth.error, auth.status);
  }

  const response = await fetch(`${getWpRestBase().replace(/\/$/, "")}/papelito/v1/catalog-pdf`, {
    cache: "no-store",
    headers: { Authorization: `Bearer ${auth.accessToken}` },
    method: "DELETE",
  });
  const json = await parseWpResponse(response);

  if (!response.ok) {
    return jsonError(json?.message ?? "Não foi possível restaurar o catálogo padrão.", response.status);
  }

  revalidatePath("/revendedor");
  return NextResponse.json(json);
}
