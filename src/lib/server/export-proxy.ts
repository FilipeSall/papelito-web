import "server-only";

import { NextResponse } from "next/server";

import { getWpRestBase } from "@/lib/server/env";

const SPREADSHEET_CONTENT_TYPE =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

/**
 * Repassa um download de planilha do WordPress preservando nome e tipo do arquivo.
 *
 * O binário atravessa como stream: nenhuma planilha é materializada na memória do
 * Next, e a querystring vai inteira para o WordPress, que é quem aplica o recorte.
 */
export async function proxyExportDownload({
  accessToken,
  failureMessage,
  path,
  request,
}: {
  accessToken: string;
  failureMessage: string;
  path: string;
  request: Request;
}) {
  const url = new URL(request.url);
  const targetUrl = new URL(`${getWpRestBase().replace(/\/$/, "")}${path}`);

  url.searchParams.forEach((value, key) => {
    targetUrl.searchParams.set(key, value);
  });

  let response: Response;

  try {
    response = await fetch(targetUrl, {
      cache: "no-store",
      headers: {
        Accept: `${SPREADSHEET_CONTENT_TYPE}, application/json`,
        Authorization: `Bearer ${accessToken}`,
      },
      method: "GET",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : failureMessage;
    return NextResponse.json({ message }, { status: 502 });
  }

  const contentType = response.headers.get("content-type") ?? "";

  if (!response.ok) {
    const payload = contentType.includes("application/json")
      ? ((await response.json().catch(() => null)) as { message?: string } | null)
      : null;

    return NextResponse.json(
      { message: payload?.message ?? failureMessage },
      { status: response.status || 500 },
    );
  }

  const headers = new Headers();
  headers.set("Content-Type", contentType || SPREADSHEET_CONTENT_TYPE);

  const disposition = response.headers.get("content-disposition");
  if (disposition) {
    headers.set("Content-Disposition", disposition);
  }

  const contentLength = response.headers.get("content-length");
  if (contentLength) {
    headers.set("Content-Length", contentLength);
  }

  return new NextResponse(response.body, { headers, status: response.status });
}
