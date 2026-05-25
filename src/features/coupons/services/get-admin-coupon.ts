import "server-only";

import { wpRest } from "@/lib/server/wp-rest";

import type { Coupon } from "../types/coupon";
import { mapWpCoupon } from "./coupon-mappers";

export async function getAdminCoupon(
  accessToken: string,
  id: number,
): Promise<Coupon> {
  const result = await wpRest<Parameters<typeof mapWpCoupon>[0]>(
    `/papelito/v1/admin/coupons/${id}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    } as Parameters<typeof wpRest>[1],
  );

  if (!result.ok) {
    throw new Error(result.error.message);
  }

  const mapped = mapWpCoupon(result.data);
  if (!mapped) {
    throw new Error("Cupom invalido retornado pelo servidor.");
  }

  return mapped;
}
