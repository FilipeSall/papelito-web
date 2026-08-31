import type { AdminVendorCreatePayload } from "@/lib/admin-vendors-types";

import type { CreatedVendor } from "./types";

type CreateVendorResponse = {
  message?: string;
  vendor?: CreatedVendor;
};

export async function createAdminVendor(payload: AdminVendorCreatePayload): Promise<CreatedVendor | null> {
  const response = await fetch("/api/admin/vendors", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = (await response.json().catch(() => null)) as CreateVendorResponse | null;

  if (!response.ok) {
    throw new Error(data?.message ?? "Não foi possível criar o vendor.");
  }

  return data?.vendor ?? null;
}
