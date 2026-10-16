import { parseFinancialProfile } from "@/features/vendor-payment-gateways/utils/parse-payment-gateways";

import { proxyVendorJson } from "../_lib/proxy-vendor-json";

/** Perfil financeiro comum: CPF e nascimento só como indicadores. */
export async function GET() {
  return proxyVendorJson({ path: "/papelito/v1/vendor/financial-profile", method: "GET", parse: parseFinancialProfile });
}

/** Edição parcial versionada; conta bancária, CPF e nascimento exigem a senha atual. */
export async function PATCH(request: Request) {
  const body: unknown = await request.json().catch(() => null);

  return proxyVendorJson({
    path: "/papelito/v1/vendor/financial-profile",
    method: "PATCH",
    json: body ?? {},
    parse: parseFinancialProfile,
    revalidate: ["vendor-payment-gateways", "vendor-eligibility"],
  });
}
