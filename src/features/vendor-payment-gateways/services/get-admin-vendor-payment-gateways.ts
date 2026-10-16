import "server-only";

import { wpRest } from "@/lib/server/wp-rest";

import type { VendorPaymentSummary } from "../types/payment-gateways";
import { parseVendorPaymentSummary } from "../utils/parse-payment-gateways";

/**
 * Espelho administrativo da saúde dos gateways de um vendor — a mesma projeção do painel do
 * vendor, autorizada pelo papel de administrador no WordPress.
 *
 * `no-store` de propósito: depois de registrar a conferência de titularidade, `router.refresh()`
 * precisa ler o estado novo. Falha ou resposta malformada devolve `null`.
 */
export async function getAdminVendorPaymentGateways(
  accessToken: string,
  vendorId: number,
): Promise<VendorPaymentSummary | null> {
  const result = await wpRest<unknown>(`/papelito/v1/admin/vendors/${vendorId}/payment-gateways`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });

  return result.ok ? parseVendorPaymentSummary(result.data) : null;
}
