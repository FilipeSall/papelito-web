import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

import { getAdminApiSession, readWithAdminApiSession } from "@/lib/server/admin-api-auth";

import { createCoupon } from "@/features/coupons/services/create-coupon";
import { getAdminCouponsSnapshot } from "@/features/coupons/services/get-admin-coupons";
import type { CouponInput, CouponListFilters } from "@/features/coupons/types/coupon";

function parseFilters(url: URL): CouponListFilters {
  const status = url.searchParams.get("status");
  const search = url.searchParams.get("search");
  const page = url.searchParams.get("page");
  const perPage = url.searchParams.get("perPage");

  return {
    status: status === "publish" || status === "draft" || status === "any" ? status : undefined,
    search: search ?? undefined,
    page: page ? Math.max(1, Number.parseInt(page, 10) || 1) : undefined,
    perPage: perPage ? Math.max(1, Number.parseInt(perPage, 10) || 20) : undefined,
  };
}

export async function GET(request: Request) {
  const filters = parseFilters(new URL(request.url));
  const result = await readWithAdminApiSession((accessToken) =>
    getAdminCouponsSnapshot(accessToken, filters),
  );

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

  const payload = (await request.json().catch(() => null)) as CouponInput | null;

  if (!payload || typeof payload.code !== "string") {
    return NextResponse.json({ message: "Payload inválido." }, { status: 400 });
  }

  try {
    const coupon = await createCoupon(auth.accessToken, payload);
    revalidateTag("admin-coupons", "max");
    return NextResponse.json({ coupon }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Não foi possível criar o cupom.";
    const status = (error as { status?: number } | null)?.status ?? 500;
    const code = (error as { code?: string } | null)?.code;
    return NextResponse.json({ message, code }, { status });
  }
}
