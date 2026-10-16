import { NextResponse } from "next/server";

import {
  MERCADOPAGO_OAUTH_BINDING_COOKIE,
  MERCADOPAGO_OAUTH_COOKIE_MAX_AGE,
  createMercadoPagoOauthBinding,
  isMercadoPagoAuthorizationUrl,
  mercadoPagoOauthCookieOptions,
} from "@/features/vendor-payment-gateways/server/mercadopago-oauth-cookie";
import { wpRest } from "@/lib/server/wp-rest";

import { requireVendorAccessToken } from "../../_lib/require-vendor-session";

type ConnectResponse = { authorizationUrl?: unknown };

const NO_STORE = { "Cache-Control": "no-store, private" };

/**
 * Inicia a conexão OAuth do Mercado Pago: grava o binding da sessão em cookie httpOnly e devolve
 * a URL de autorização montada pelo WordPress. Nenhum token passa por aqui.
 */
export async function POST() {
  const auth = await requireVendorAccessToken();

  if ("error" in auth) {
    return NextResponse.json({ message: auth.error }, { status: auth.status });
  }

  const binding = createMercadoPagoOauthBinding();
  const result = await wpRest<ConnectResponse>("/papelito/v1/vendor/mercadopago/connect", {
    method: "POST",
    headers: { Authorization: `Bearer ${auth.accessToken}` },
    json: { binding },
    cache: "no-store",
  });

  if (!result.ok) {
    return NextResponse.json(
      { code: result.error.code, message: result.error.message },
      { status: result.status || 500, headers: NO_STORE },
    );
  }

  if (!isMercadoPagoAuthorizationUrl(result.data.authorizationUrl)) {
    return NextResponse.json(
      { code: "papelito_mercadopago_invalid_authorization_url", message: "Não foi possível iniciar a conexão com o Mercado Pago." },
      { status: 502, headers: NO_STORE },
    );
  }

  const response = NextResponse.json({ authorizationUrl: result.data.authorizationUrl }, { headers: NO_STORE });
  response.cookies.set(MERCADOPAGO_OAUTH_BINDING_COOKIE, binding, mercadoPagoOauthCookieOptions(MERCADOPAGO_OAUTH_COOKIE_MAX_AGE));

  return response;
}
