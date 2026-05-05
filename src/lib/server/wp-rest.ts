import "server-only";

import { getWpRestBase } from "@/lib/server/env";

export type WpRestError = {
  code: string;
  message: string;
  data?: { status?: number } & Record<string, unknown>;
};

export async function wpRest<T>(
  path: string,
  init: RequestInit & { json?: unknown } = {},
): Promise<{ ok: true; status: number; data: T } | { ok: false; status: number; error: WpRestError }> {
  const { json, headers, ...rest } = init;
  const url = `${getWpRestBase().replace(/\/$/, "")}${path.startsWith("/") ? path : `/${path}`}`;

  const response = await fetch(url, {
    method: rest.method ?? (json !== undefined ? "POST" : "GET"),
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(headers as Record<string, string> | undefined),
    },
    body: json !== undefined ? JSON.stringify(json) : rest.body,
    cache: "no-store",
    ...rest,
  });

  const status = response.status;
  const text = await response.text();
  const parsed = text ? (JSON.parse(text) as unknown) : null;

  if (!response.ok) {
    const err = parsed as WpRestError | null;
    return {
      ok: false,
      status,
      error: err ?? { code: "papelito_unknown", message: "Erro desconhecido", data: { status } },
    };
  }

  return { ok: true, status, data: parsed as T };
}
