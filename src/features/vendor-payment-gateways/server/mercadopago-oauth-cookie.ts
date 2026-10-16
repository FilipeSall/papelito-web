import "server-only";

/** Cookie httpOnly que amarra o retorno do OAuth à sessão do navegador que iniciou a conexão. */
export const MERCADOPAGO_OAUTH_BINDING_COOKIE = "papelito_mp_oauth_binding";

/** Escopo do cookie: só as rotas de conexão do Mercado Pago o recebem. */
export const MERCADOPAGO_OAUTH_COOKIE_PATH = "/api/vendor/mercadopago";

/** Validade do binding, igual à do state guardado no WordPress. */
export const MERCADOPAGO_OAUTH_COOKIE_MAX_AGE = 600;

/**
 * Valor aleatório de 256 bits em base64url para o binding da sessão.
 *
 * O WordPress guarda só o hash; o valor em claro vive apenas neste cookie httpOnly.
 */
export function createMercadoPagoOauthBinding(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));

  return Buffer.from(bytes).toString("base64url");
}

/**
 * Atributos do cookie de binding; `secure` só fora do ambiente local para o fluxo funcionar em http://localhost.
 */
export function mercadoPagoOauthCookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    maxAge,
    path: MERCADOPAGO_OAUTH_COOKIE_PATH,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
  };
}

/**
 * Aceita só URL HTTPS do domínio do Mercado Pago como destino da autorização.
 *
 * Fail-closed: qualquer outra coisa vinda do backend é tratada como resposta inválida.
 */
export function isMercadoPagoAuthorizationUrl(value: unknown): value is string {
  if (typeof value !== "string") return false;

  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();

    return url.protocol === "https:" && (host === "mercadopago.com.br" || host.endsWith(".mercadopago.com.br") || host.endsWith(".mercadopago.com"));
  } catch {
    return false;
  }
}
