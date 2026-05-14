import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth";
import { getWpRestBase } from "@/lib/server/env";

function normalizeRole(role: unknown) {
  return typeof role === "string" ? role.trim().toLowerCase() : undefined;
}

async function getAdminAccessToken() {
  const session = await getServerSession(authOptions);

  if (!session?.user || !session.accessToken) {
    return { error: "Nao autenticado.", status: 401 as const };
  }

  if (normalizeRole(session.role) !== "administrator") {
    return { error: "Acesso administrativo necessario.", status: 403 as const };
  }

  return { accessToken: session.accessToken };
}

export async function GET(request: Request) {
  const auth = await getAdminAccessToken();

  if ("error" in auth) {
    return NextResponse.json({ message: auth.error }, { status: auth.status });
  }

  const url = new URL(request.url);
  const targetUrl = new URL(
    `${getWpRestBase().replace(/\/$/, "")}/papelito/v1/admin/reports/sales/export`,
  );

  url.searchParams.forEach((value, key) => {
    targetUrl.searchParams.set(key, value);
  });

  let response: Response;
  try {
    response = await fetch(targetUrl, {
      headers: {
        Accept:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/json",
        Authorization: `Bearer ${auth.accessToken}`,
      },
      cache: "no-store",
      method: "GET",
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Falha de rede ao exportar vendas.";
    return NextResponse.json({ message }, { status: 502 });
  }

  const contentType = response.headers.get("content-type") ?? "";

  if (!response.ok) {
    if (contentType.includes("application/json")) {
      const payload = (await response.json().catch(() => null)) as { message?: string } | null;
      return NextResponse.json(
        { message: payload?.message ?? "Nao foi possivel exportar vendas." },
        { status: response.status },
      );
    }

    return NextResponse.json(
      { message: "Nao foi possivel exportar vendas." },
      { status: response.status || 500 },
    );
  }

  const headers = new Headers();
  headers.set(
    "Content-Type",
    contentType || "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  );

  const disposition = response.headers.get("content-disposition");
  if (disposition) {
    headers.set("Content-Disposition", disposition);
  }

  const contentLength = response.headers.get("content-length");
  if (contentLength) {
    headers.set("Content-Length", contentLength);
  }

  return new NextResponse(response.body, {
    headers,
    status: response.status,
  });
}
