import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

import { getAdminApiSession, readWithAdminApiSession } from "@/lib/server/admin-api-auth";
import {
  createCategory,
  getAdminTaxonomySnapshot,
  taxonomyErrorResponse,
} from "@/lib/server/admin-taxonomy";

export async function GET() {
  const result = await readWithAdminApiSession(getAdminTaxonomySnapshot);

  if ("error" in result) {
    return NextResponse.json({ message: result.error }, { status: result.status });
  }

  return NextResponse.json(result.data);
}


export async function POST(request: Request) {
  const auth = await getAdminApiSession();

  if ("error" in auth) {
    return NextResponse.json({ message: auth.error }, { status: auth.status });
  }

  const payload = await request.json().catch(() => null);

  if (!payload) {
    return NextResponse.json({ message: "Payload inválido." }, { status: 400 });
  }

  try {
    const category = await createCategory(auth.accessToken, payload);
    revalidateTag("admin-taxonomy", "max");
    revalidateTag("wp:categories", "max");
    return NextResponse.json({ category }, { status: 201 });
  } catch (error) {
    const response = taxonomyErrorResponse(error, "Não foi possível criar a categoria.");
    return NextResponse.json(response.body, { status: response.status });
  }
}
