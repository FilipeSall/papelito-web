import "server-only";

import { wpRest } from "@/lib/server/wp-rest";

export async function deleteCoupon(accessToken: string, id: number): Promise<void> {
  const result = await wpRest<{ deleted: boolean; id: number }>(
    `/papelito/v1/admin/coupons/${id}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
      method: "DELETE",
    },
  );

  if (!result.ok) {
    throw new Error(result.error.message);
  }
}
