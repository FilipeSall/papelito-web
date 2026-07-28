import "server-only";

import { getWpRestBase } from "@/lib/server/env";

export type WpRestError = {
  code: string;
  message: string;
  data?: { status?: number } & Record<string, unknown>;
};

export type WpRestSuccess<T> = {
  ok: true;
  status: number;
  data: T;
  headers: Headers;
};

export type WpRestFailure = {
  ok: false;
  status: number;
  error: WpRestError;
  headers?: Headers;
};

export type WpRestResult<T> = WpRestSuccess<T> | WpRestFailure;

function buildError(code: string, message: string, status: number): WpRestError {
  return { code, message, data: { status } };
}

export async function wpRest<T>(
  path: string,
  init: RequestInit & { json?: unknown; revalidate?: number; tags?: string[] } = {},
): Promise<WpRestResult<T>> {
  const { json, headers, revalidate, tags, ...rest } = init;
  const url = `${getWpRestBase().replace(/\/$/, "")}${path.startsWith("/") ? path : `/${path}`}`;

  const cacheConfig =
    typeof revalidate === "number"
      ? { next: { revalidate, ...(tags?.length ? { tags } : {}) } }
      : { cache: "no-store" as const };

  let response: Response;
  try {
    response = await fetch(url, {
      method: rest.method ?? (json !== undefined ? "POST" : "GET"),
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(headers as Record<string, string> | undefined),
      },
      body: json !== undefined ? JSON.stringify(json) : rest.body,
      ...cacheConfig,
      ...rest,
    });
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : "Falha de rede ao consultar WordPress.";
    return {
      ok: false,
      status: 0,
      error: buildError("papelito_network_error", message, 0),
    };
  }

  const status = response.status;
  let text: string;
  try {
    text = await response.text();
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : "Falha ao ler resposta do WordPress.";
    return {
      ok: false,
      status,
      error: buildError("papelito_read_error", message, status),
      headers: response.headers,
    };
  }

  let parsed: unknown = null;
  if (text) {
    try {
      parsed = JSON.parse(text);
    } catch {
      return {
        ok: false,
        status,
        error: buildError(
          "papelito_invalid_json",
          `Resposta não-JSON do WordPress (status ${status}).`,
          status,
        ),
        headers: response.headers,
      };
    }
  }

  if (!response.ok) {
    const err = parsed as WpRestError | null;
    return {
      ok: false,
      status,
      error: err ?? buildError("papelito_unknown", "Erro desconhecido", status),
      headers: response.headers,
    };
  }

  return { ok: true, status, data: parsed as T, headers: response.headers };
}
