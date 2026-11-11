import "server-only";

import { NextResponse } from "next/server";

import { getUserApiSession } from "@/lib/server/company-api";
import { getWpRestBase } from "@/lib/server/env";
import { wpRest } from "@/lib/server/wp-rest";

import { EXPOCANNABIS_EVENT_ID } from "../constants";

const NO_STORE = { "Cache-Control": "no-store, private" };

const EVENT_BASE = `/papelito/v1/event/${EXPOCANNABIS_EVENT_ID}`;

const ORDER_ID = /^\d{1,18}$/;

/** Opções de {@link proxyEventJson}. */
export type ProxyEventJsonOptions = {
  /** Caminho depois de `event/{id}`, como `/quote` ou `/orders/12/status`. */
  path: string;
  method: "GET" | "POST";
  /** Corpo repassado como JSON; o WordPress revalida tudo. */
  json?: unknown;
  /** Chave de idempotência do tablet, repassada no cabeçalho `Idempotency-Key`. */
  idempotencyKey?: string | null;
};

function authError(): NextResponse {
  return NextResponse.json(
    { code: "papelito_event_auth_required", message: "Entre com a conta de operador do evento." },
    { status: 401, headers: NO_STORE },
  );
}

function authHeaders(accessToken: string, idempotencyKey?: string | null): Record<string, string> {
  return {
    Authorization: `Bearer ${accessToken}`,
    ...(idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {}),
  };
}

/**
 * Repassa uma rota do tablet ao WordPress com o Bearer do operador, sem cache e sem decidir nada.
 *
 * Erro do WordPress mantém status, código e dados (como a cotação nova de `quote_changed`); a rota
 * inexistente vira `papelito_event_disabled`, porque é assim que a flag desligada aparece.
 */
export async function proxyEventJson(options: ProxyEventJsonOptions): Promise<NextResponse> {
  const auth = await getUserApiSession();

  if ("error" in auth) {
    return authError();
  }

  const result = await wpRest<unknown>(`${EVENT_BASE}${options.path}`, {
    method: options.method,
    headers: authHeaders(auth.accessToken, options.idempotencyKey),
    json: options.json,
    cache: "no-store",
  });

  if (result.ok) {
    return NextResponse.json(result.data, { status: result.status, headers: NO_STORE });
  }

  if (result.error.code === "rest_no_route") {
    return NextResponse.json(
      { code: "papelito_event_disabled", message: "A venda do evento não está ligada." },
      { status: 404, headers: NO_STORE },
    );
  }

  return NextResponse.json(
    { code: result.error.code, message: result.error.message, ...(result.error.data ? { data: result.error.data } : {}) },
    { status: result.status || 502, headers: NO_STORE },
  );
}

/**
 * Repassa um download do evento (o CSV do repasse) com os cabeçalhos de arquivo do WordPress.
 *
 * Erro volta como JSON com o status original.
 */
export async function proxyEventDownload(path: string): Promise<NextResponse> {
  const auth = await getUserApiSession();

  if ("error" in auth) {
    return authError();
  }

  const response = await fetch(`${getWpRestBase().replace(/\/$/, "")}${EVENT_BASE}${path}`, {
    headers: authHeaders(auth.accessToken),
    cache: "no-store",
  });

  if (!response.ok) {
    const body: unknown = await response.json().catch(() => null);
    return NextResponse.json(body ?? { code: "papelito_unknown", message: "Erro ao baixar o arquivo." }, {
      status: response.status,
      headers: NO_STORE,
    });
  }

  return new NextResponse(await response.arrayBuffer(), {
    status: 200,
    headers: {
      ...NO_STORE,
      "Content-Type": response.headers.get("Content-Type") ?? "text/csv; charset=UTF-8",
      "Content-Disposition": response.headers.get("Content-Disposition") ?? "attachment",
    },
  });
}

/** Id de pedido da URL, ou `null` quando não é número de até 18 dígitos. */
export function parseEventOrderId(raw: string): string | null {
  return ORDER_ID.test(raw) ? raw : null;
}

/** Resposta 404 para id de pedido inválido, sem tocar o WordPress. */
export function eventOrderNotFound(): NextResponse {
  return NextResponse.json(
    { code: "papelito_event_order_not_found", message: "Pedido não encontrado." },
    { status: 404, headers: NO_STORE },
  );
}

/** Corpo JSON da requisição do tablet, ou objeto vazio quando não há corpo legível. */
export async function readEventJson(request: Request): Promise<unknown> {
  try {
    const text = await request.text();
    return text ? JSON.parse(text) : {};
  } catch {
    return {};
  }
}
