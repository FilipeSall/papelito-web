import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

import { wpRest } from "@/lib/server/wp-rest";

import { requireVendorAccessToken } from "./require-vendor-session";

const NO_STORE = { "Cache-Control": "no-store, private" };

type ProxyVendorJsonOptions = {
  /** Caminho REST do WordPress, já com o namespace. */
  path: string;
  method: "GET" | "POST" | "PUT" | "PATCH";
  /** Corpo repassado como JSON; o WordPress revalida tudo. */
  json?: unknown;
  /** Tags do Data Cache invalidadas depois de uma mutação bem-sucedida. */
  revalidate?: string[];
  /** Parser fail-closed da resposta; `null` vira 502 em vez de dado malformado. */
  parse?: (data: unknown) => unknown;
};

/**
 * Proxy autenticado de vendor para rotas JSON do WordPress, sem cache e sem decidir nada.
 *
 * O token da sessão só existe no servidor. Erro do WordPress mantém status e código para o
 * catálogo de mensagens; resposta que não passa no parser é tratada como falha (502).
 */
export async function proxyVendorJson(options: ProxyVendorJsonOptions): Promise<NextResponse> {
  const auth = await requireVendorAccessToken();

  if ("error" in auth) {
    return NextResponse.json({ message: auth.error }, { status: auth.status, headers: NO_STORE });
  }

  const result = await wpRest<unknown>(options.path, {
    method: options.method,
    headers: { Authorization: `Bearer ${auth.accessToken}` },
    json: options.json,
    cache: "no-store",
  });

  if (!result.ok) {
    return NextResponse.json(
      { code: result.error.code, message: result.error.message },
      { status: result.status || 500, headers: NO_STORE },
    );
  }

  const data = options.parse ? options.parse(result.data) : result.data;

  if (data === null || data === undefined) {
    return NextResponse.json(
      { code: "papelito_invalid_response", message: "Resposta inválida do servidor." },
      { status: 502, headers: NO_STORE },
    );
  }

  for (const tag of options.revalidate ?? []) {
    revalidateTag(tag, "max");
  }

  return NextResponse.json(data, { headers: NO_STORE });
}
