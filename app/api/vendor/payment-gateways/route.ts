import { parseVendorPaymentSummary } from "@/features/vendor-payment-gateways/utils/parse-payment-gateways";

import { proxyVendorJson } from "../_lib/proxy-vendor-json";

/** Saúde dos dois gateways, preferência e conta Mercado Pago do vendor autenticado. */
export async function GET() {
  return proxyVendorJson({ path: "/papelito/v1/vendor/payment-gateways", method: "GET", parse: parseVendorPaymentSummary });
}
