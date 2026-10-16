const MERCADO_PAGO_DOMAINS = ["mercadopago.com.br", "mercadopago.com", "mercadolivre.com.br"];

function isMercadoPagoHost(hostname: string) {
  const host = hostname.toLowerCase();

  return MERCADO_PAGO_DOMAINS.some((domain) => host === domain || host.endsWith(`.${domain}`));
}

/**
 * Diz se a URL pode receber o navegador do comprador: só HTTPS, sem credencial embutida e em
 * domínio do Mercado Pago (o mesmo allowlist de `papelito_mercadopago_redirect_is_allowed`).
 * Qualquer outra coisa é tratada como resposta malformada, nunca como redirect.
 */
export function isAllowedMercadoPagoUrl(value: unknown): value is string {
  if (typeof value !== "string" || !value) return false;

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return false;
  }

  return url.protocol === "https:" && !url.username && !url.password && isMercadoPagoHost(url.hostname);
}
