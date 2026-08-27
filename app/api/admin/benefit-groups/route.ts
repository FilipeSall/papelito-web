import { NextResponse } from "next/server";

import { getAdminApiSession, readWithAdminApiSession } from "@/lib/server/admin-api-auth";
import {
  benefitsErrorResponse,
  createBenefitGroup,
  getAdminBenefitGroupsSnapshot,
} from "@/lib/server/admin-product-benefits";

import { invalidateBenefits } from "./invalidate";

export async function GET() {
  const result = await readWithAdminApiSession(getAdminBenefitGroupsSnapshot);

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
    const snapshot = await createBenefitGroup(auth.accessToken, payload);
    invalidateBenefits();
    return NextResponse.json(snapshot, { status: 201 });
  } catch (error) {
    const response = benefitsErrorResponse(error, "Não foi possível criar a configuração.");
    return NextResponse.json(response.body, { status: response.status });
  }
}
