import { proxyVendorJson } from "../_lib/proxy-vendor-json";

/** Salva o gateway preferido com a versão lida; o WordPress recusa gateway inapto ou bloqueado. */
export async function PUT(request: Request) {
  const body: unknown = await request.json().catch(() => null);

  return proxyVendorJson({
    path: "/papelito/v1/vendor/payment-preferences",
    method: "PUT",
    json: body ?? {},
    revalidate: ["vendor-payment-gateways"],
  });
}
