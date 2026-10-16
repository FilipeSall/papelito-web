import { parseVendorPaymentSummary } from "@/features/vendor-payment-gateways/utils/parse-payment-gateways";

import { proxyVendorJson } from "../../_lib/proxy-vendor-json";

/** Reconsulta neutra do estado dos gateways (limitada por vendor no WordPress). */
export async function POST() {
  return proxyVendorJson({
    path: "/papelito/v1/vendor/payment-gateways/refresh",
    method: "POST",
    parse: parseVendorPaymentSummary,
    revalidate: ["vendor-payment-gateways", "vendor-eligibility"],
  });
}
