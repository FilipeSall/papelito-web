import { revalidateTag } from "next/cache";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth";
import { createCoupon } from "@/features/coupons/services/create-coupon";
import { getAdminCouponsSnapshot } from "@/features/coupons/services/get-admin-coupons";
import type { CouponInput, CouponListFilters } from "@/features/coupons/types/coupon";

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
  const auth = await getAdminAccessToken();

  if ("error" in auth) {
    return NextResponse.json({ message: auth.error }, { status: auth.status });
  }

  const filters = parseFilters(new URL(request.url));
  const snapshot = await getAdminCouponsSnapshot(auth.accessToken, filters);

  return NextResponse.json(snapshot);
}

export async function POST(request: Request) {
  const auth = await getAdminAccessToken();

  if ("error" in auth) {
    return NextResponse.json({ message: auth.error }, { status: auth.status });
  }

  const payload = (await request.json().catch(() => null)) as CouponInput | null;

  if (!payload || typeof payload.code !== "string") {
    return NextResponse.json({ message: "Payload invalido." }, { status: 400 });
  }

  try {
    const coupon = await createCoupon(auth.accessToken, payload);
    revalidateTag("admin-coupons", "max");
    return NextResponse.json({ coupon }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Nao foi possivel criar o cupom.";
    const status = (error as { status?: number } | null)?.status ?? 500;
    const code = (error as { code?: string } | null)?.code;
    return NextResponse.json({ message, code }, { status });
  }
}
