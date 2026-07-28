import "server-only";

import { wpRest } from "@/lib/server/wp-rest";

import type { Coupon, CouponInput } from "../types/coupon";
import { mapWpCoupon, toWpCouponPayload } from "./coupon-mappers";

export async function updateCoupon(
  accessToken: string,
  id: number,
  input: CouponInput,
): Promise<Coupon> {
  const result = await wpRest<Parameters<typeof mapWpCoupon>[0]>(
    `/papelito/v1/admin/coupons/${id}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
      method: "PUT",
      json: toWpCouponPayload(input),
    },
  );

  if (!result.ok) {
    const err = new Error(result.error.message);
    (err as Error & { code?: string; status?: number }).code = result.error.code;
    (err as Error & { code?: string; status?: number }).status = result.status;
    throw err;
  }

  const mapped = mapWpCoupon(result.data);
  if (!mapped) {
    throw new Error("Cupom inválido retornado após atualização.");
  }

  return mapped;
}
