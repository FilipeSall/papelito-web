import { revalidateTag } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";

import {
  MERCADOPAGO_OAUTH_BINDING_COOKIE,
  mercadoPagoOauthCookieOptions,
} from "@/features/vendor-payment-gateways/server/mercadopago-oauth-cookie";
import { wpRest } from "@/lib/server/wp-rest";

import { requireVendorAccessToken } from "../../_lib/require-vendor-session";

const SETTINGS_PATH = "/vendor/configuracoes";

function redirectToSettings(request: NextRequest, outcome: string, reason?: string) {
  const target = new URL(SETTINGS_PATH, request.url);
  target.searchParams.set("mercadopago", outcome);
  if (reason) target.searchParams.set("reason", reason);
  target.hash = "pagamentos";

  const response = NextResponse.redirect(target, 303);
  response.headers.set("Cache-Control", "no-store, private");
  response.headers.set("Referrer-Policy", "no-referrer");
  response.cookies.set(MERCADOPAGO_OAUTH_BINDING_COOKIE, "", mercadoPagoOauthCookieOptions(0));

  return response;
}

/**
 * Retorno do OAuth do Mercado Pago (é a `MERCADOPAGO_REDIRECT_URI`).
 *
 * Confirma a sessão de vendor e o cookie da sessão iniciadora antes de repassar code/state ao
 * WordPress, server-to-server. Sem sessão ou sem cookie o código não é consumido. O destino nunca
 * carrega code/state, e a resposta não é cacheada nem envia referrer.
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;

  if (params.get("error")) {
    return redirectToSettings(request, "denied");
  }

  const binding = request.cookies.get(MERCADOPAGO_OAUTH_BINDING_COOKIE)?.value ?? "";
  const auth = await requireVendorAccessToken();

  if ("error" in auth || !binding) {
    return redirectToSettings(request, "session_required");
  }

  const result = await wpRest<unknown>("/papelito/v1/mercadopago/oauth/callback", {
    method: "POST",
    headers: { Authorization: `Bearer ${auth.accessToken}` },
    json: { code: params.get("code") ?? "", state: params.get("state") ?? "", binding },
    cache: "no-store",
  });

  if (!result.ok) {
    return redirectToSettings(request, "error", result.error.code);
  }

  revalidateTag("vendor-eligibility", "max");
  revalidateTag("vendor-payment-gateways", "max");

  return redirectToSettings(request, "connected");
}
