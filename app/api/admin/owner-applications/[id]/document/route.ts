import { NextResponse } from "next/server";

import { getAdminApiSession } from "@/lib/server/admin-api-auth";
import { getWpRestBase } from "@/lib/server/env";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await getAdminApiSession();
  if ("error" in auth) {
    return NextResponse.json({ message: auth.error }, { status: auth.status });
  }

  const { id } = await params;
  const applicationId = Number.parseInt(id, 10);
  if (!Number.isFinite(applicationId) || applicationId <= 0) {
    return NextResponse.json({ message: "Candidatura inválida." }, { status: 400 });
  }

  const response = await fetch(
    `${getWpRestBase().replace(/\/$/, "")}/papelito/v1/admin/owner-applications/${applicationId}/document`,
    {
      headers: { Authorization: `Bearer ${auth.accessToken}` },
      cache: "no-store",
    },
  );
  if (!response.ok) {
    const error = (await response.json().catch(() => null)) as { message?: string } | null;
    return NextResponse.json(
      { message: error?.message ?? "Documento indisponível." },
      { status: response.status },
    );
  }

  return new NextResponse(response.body, {
    status: 200,
    headers: {
      "Content-Type": response.headers.get("Content-Type") ?? "application/octet-stream",
      "Content-Disposition": response.headers.get("Content-Disposition") ?? "inline",
      "Cache-Control": "private, no-store, max-age=0",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
