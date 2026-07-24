import "server-only";

import { NextResponse } from "next/server";

import { getUserApiSession } from "./company-api";
import { wpRest } from "./wp-rest";

const IDEMPOTENT_METHODS = new Set(["POST", "PATCH", "DELETE", "PUT"]);

/**
 * Encaminha uma requisição autenticada para um endpoint REST da empresa no WordPress, mantendo o
 * token do usuário server-side. Repassa Idempotency-Key para mutações e o corpo JSON quando houver.
 *
 * O WordPress é a autoridade: ele reautoriza (matriz RBAC), resolve a empresa ativa e valida a
 * idempotência. Este proxy nunca decide permissão nem envia companyId como fonte de verdade.
 */
export async function proxyCompanyRequest(
  request: Request,
  wpPath: string,
): Promise<NextResponse> {
  const auth = await getUserApiSession();
  if ("error" in auth) {
    return NextResponse.json({ message: auth.error }, { status: auth.status });
  }

  const method = request.method.toUpperCase();
  const headers: Record<string, string> = {
    Authorization: `Bearer ${auth.accessToken}`,
  };

  if (IDEMPOTENT_METHODS.has(method)) {
    const key = request.headers.get("Idempotency-Key");
    // Gera uma chave estável do lado do servidor quando o cliente não enviar — mutações sempre
    // exigem Idempotency-Key no backend.
    headers["Idempotency-Key"] = key ?? crypto.randomUUID();
  }

  let json: unknown;
  if (method !== "GET" && method !== "DELETE") {
    try {
      const text = await request.text();
      json = text ? JSON.parse(text) : undefined;
    } catch {
      return NextResponse.json({ message: "Payload inválido." }, { status: 400 });
    }
  }

  const query = new URL(request.url).searchParams.toString();
  const path = `${wpPath}${query ? `?${query}` : ""}`;

  const result = await wpRest(path, {
    method,
    headers,
    ...(json !== undefined ? { json } : {}),
  });

  return result.ok
    ? NextResponse.json(result.data, { status: result.status })
    : NextResponse.json(result.error, { status: result.status || 502 });
}
