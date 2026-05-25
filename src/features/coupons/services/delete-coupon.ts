import "server-only";

import { wpRest } from "@/lib/server/wp-rest";

export class DeleteCouponError extends Error {
  status: number;
  code: string;

  constructor(message: string, status: number, code: string) {
    super(message);
    this.name = "DeleteCouponError";
    this.status = status;
    this.code = code;
  }
}

export async function deleteCoupon(accessToken: string, id: number): Promise<void> {
  const result = await wpRest<{ deleted: boolean; id: number }>(
    `/papelito/v1/admin/coupons/${id}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
      method: "DELETE",
    },
  );

  if (!result.ok) {
    throw new DeleteCouponError(
      result.error.message,
      result.status || 500,
      result.error.code,
    );
  }
}
