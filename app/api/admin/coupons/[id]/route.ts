import { revalidateTag } from "next/cache";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth";
import { deleteCoupon } from "@/features/coupons/services/delete-coupon";
import { getAdminCoupon } from "@/features/coupons/services/get-admin-coupon";
import { updateCoupon } from "@/features/coupons/services/update-coupon";
import type { CouponInput } from "@/features/coupons/types/coupon";

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

async function resolveId(params: Promise<{ id: string }>) {
  const { id } = await params;
  const parsed = Number.parseInt(id, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await getAdminAccessToken();
  if ("error" in auth) {
    return NextResponse.json({ message: auth.error }, { status: auth.status });
  }

  const id = await resolveId(params);
  if (!id) return NextResponse.json({ message: "ID invalido." }, { status: 422 });

  try {
    const coupon = await getAdminCoupon(auth.accessToken, id);
    return NextResponse.json({ coupon });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Cupom nao encontrado.";
    return NextResponse.json({ message }, { status: 404 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await getAdminAccessToken();
  if ("error" in auth) {
    return NextResponse.json({ message: auth.error }, { status: auth.status });
  }

  const id = await resolveId(params);
  if (!id) return NextResponse.json({ message: "ID invalido." }, { status: 422 });

  const payload = (await request.json().catch(() => null)) as CouponInput | null;
  if (!payload || typeof payload.code !== "string") {
    return NextResponse.json({ message: "Payload invalido." }, { status: 400 });
  }

  try {
    const coupon = await updateCoupon(auth.accessToken, id, payload);
    revalidateTag("admin-coupons", "max");
    return NextResponse.json({ coupon });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Nao foi possivel atualizar o cupom.";
    const status = (error as { status?: number } | null)?.status ?? 500;
    const code = (error as { code?: string } | null)?.code;
    return NextResponse.json({ message, code }, { status });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await getAdminAccessToken();
  if ("error" in auth) {
    return NextResponse.json({ message: auth.error }, { status: auth.status });
  }

  const id = await resolveId(params);
  if (!id) return NextResponse.json({ message: "ID invalido." }, { status: 422 });

  try {
    await deleteCoupon(auth.accessToken, id);
    revalidateTag("admin-coupons", "max");
    return NextResponse.json({ deleted: true, id });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Nao foi possivel remover o cupom.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
