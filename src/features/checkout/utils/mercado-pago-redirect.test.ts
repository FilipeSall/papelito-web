import { describe, expect, it } from "vitest";

import { isAllowedMercadoPagoUrl } from "./mercado-pago-redirect";

describe("isAllowedMercadoPagoUrl", () => {
  it.each([
    "https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=1-abc",
    "https://sandbox.mercadopago.com.br/checkout/v1/redirect?pref_id=1-abc",
    "https://mercadopago.com/checkout",
    "https://www.mercadolivre.com.br/pagar",
  ])("aceita %s", (url) => {
    expect(isAllowedMercadoPagoUrl(url)).toBe(true);
  });

  it.each([
    "http://www.mercadopago.com.br/checkout",
    "https://mercadopago.com.br.evil.com/checkout",
    "https://evilmercadopago.com.br/checkout",
    "https://user:pass@www.mercadopago.com.br/checkout",
    "javascript:alert(1)",
    "/checkout/sucesso/1",
    "",
    undefined,
    42,
  ])("recusa %s", (url) => {
    expect(isAllowedMercadoPagoUrl(url)).toBe(false);
  });
});
