import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth";
import { wpRest } from "@/lib/server/wp-rest";

function normalizeRole(role: unknown) {
  return typeof role === "string" ? role.trim().toLowerCase() : undefined;
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user || !session.accessToken) {
    return NextResponse.json({ message: "Nao autenticado." }, { status: 401 });
  }

  if (normalizeRole(session.role) !== "administrator") {
    return NextResponse.json({ message: "Acesso administrativo necessario." }, { status: 403 });
  }

  const url = new URL(request.url);
  const search = url.searchParams.get("search") ?? "";
  const params = new URLSearchParams();
  if (search.trim()) params.set("search", search.trim());

  const result = await wpRest<{ items: unknown[] }>(
    `/papelito/v1/admin/coupons/vendor-options${params.toString() ? `?${params.toString()}` : ""}`,
    {
      headers: { Authorization: `Bearer ${session.accessToken}` },
      cache: "no-store",
    } as Parameters<typeof wpRest>[1],
  );

  if (!result.ok) {
    return NextResponse.json({ message: result.error.message }, { status: result.status || 500 });
  }

  return NextResponse.json(result.data);
}
