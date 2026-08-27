import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

import { getAdminApiSession, readWithAdminApiSession } from "@/lib/server/admin-api-auth";

import { deleteCoupon, DeleteCouponError } from "@/features/coupons/services/delete-coupon";
import { getAdminCoupon } from "@/features/coupons/services/get-admin-coupon";
import { updateCoupon } from "@/features/coupons/services/update-coupon";
import type { CouponInput } from "@/features/coupons/types/coupon";

async function resolveId(params: Promise<{ id: string }>) {
  const { id } = await params;
  const parsed = Number.parseInt(id, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const id = await resolveId(params);
  if (!id) return NextResponse.json({ message: "ID inválido." }, { status: 422 });

  try {
    const result = await readWithAdminApiSession((accessToken) =>
      getAdminCoupon(accessToken, id),
    );

    if ("error" in result) {
      return NextResponse.json({ message: result.error }, { status: result.status });
    }

    return NextResponse.json({ coupon: result.data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Cupom não encontrado.";
    return NextResponse.json({ message }, { status: 404 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await getAdminApiSession();
  if ("error" in auth) {
    return NextResponse.json({ message: auth.error }, { status: auth.status });
  }

  const id = await resolveId(params);
  if (!id) return NextResponse.json({ message: "ID inválido." }, { status: 422 });

  const payload = (await request.json().catch(() => null)) as CouponInput | null;
  if (!payload || typeof payload.code !== "string") {
    return NextResponse.json({ message: "Payload inválido." }, { status: 400 });
  }

  try {
    const coupon = await updateCoupon(auth.accessToken, id, payload);
    revalidateTag("admin-coupons", "max");
    return NextResponse.json({ coupon });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Não foi possível atualizar o cupom.";
    const status = (error as { status?: number } | null)?.status ?? 500;
    const code = (error as { code?: string } | null)?.code;
    return NextResponse.json({ message, code }, { status });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await getAdminApiSession();
  if ("error" in auth) {
    return NextResponse.json({ message: auth.error }, { status: auth.status });
  }

  const id = await resolveId(params);
  if (!id) return NextResponse.json({ message: "ID inválido." }, { status: 422 });

  try {
    await deleteCoupon(auth.accessToken, id);
    revalidateTag("admin-coupons", "max");
    return NextResponse.json({ deleted: true, id });
  } catch (error) {
    if (error instanceof DeleteCouponError) {
      console.error("[admin/coupons:DELETE]", { id, code: error.code, status: error.status, message: error.message });
      const isMissing = error.status === 404 || error.code === "papelito_coupon_not_found";
      return NextResponse.json(
        { message: error.message, code: error.code },
        { status: isMissing ? 404 : error.status },
      );
    }
    const message = error instanceof Error ? error.message : "Não foi possível remover o cupom.";
    console.error("[admin/coupons:DELETE]", { id, message });
    return NextResponse.json({ message }, { status: 500 });
  }
}
