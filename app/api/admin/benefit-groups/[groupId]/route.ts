import { NextResponse } from "next/server";

import { getAdminApiSession } from "@/lib/server/admin-api-auth";
import {
  benefitsErrorResponse,
  deleteBenefitGroup,
  updateBenefitGroup,
} from "@/lib/server/admin-product-benefits";

import { invalidateBenefits } from "../invalidate";

function parseId(value: string) {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ groupId: string }> },
) {
  const auth = await getAdminApiSession();

  if ("error" in auth) {
    return NextResponse.json({ message: auth.error }, { status: auth.status });
  }

  const groupId = parseId((await params).groupId);

  if (groupId === null) {
    return NextResponse.json({ message: "Configuração inválida." }, { status: 422 });
  }

  const payload = await request.json().catch(() => null);

  if (!payload) {
    return NextResponse.json({ message: "Payload inválido." }, { status: 400 });
  }

  try {
    const snapshot = await updateBenefitGroup(auth.accessToken, groupId, payload);
    invalidateBenefits();
    return NextResponse.json(snapshot);
  } catch (error) {
    const response = benefitsErrorResponse(error, "Não foi possível salvar a configuração.");
    return NextResponse.json(response.body, { status: response.status });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ groupId: string }> },
) {
  const auth = await getAdminApiSession();

  if ("error" in auth) {
    return NextResponse.json({ message: auth.error }, { status: auth.status });
  }

  const groupId = parseId((await params).groupId);

  if (groupId === null) {
    return NextResponse.json({ message: "Configuração inválida." }, { status: 422 });
  }

  try {
    const snapshot = await deleteBenefitGroup(auth.accessToken, groupId);
    invalidateBenefits();
    return NextResponse.json(snapshot);
  } catch (error) {
    const response = benefitsErrorResponse(error, "Não foi possível excluir a configuração.");
    return NextResponse.json(response.body, { status: response.status });
  }
}
