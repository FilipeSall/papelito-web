import { afterEach, describe, expect, it, vi } from "vitest";

import { redirectToCheckoutPro, reserveCheckoutProTab } from "./redirect-to-checkout-pro";

const MP_URL = "https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=1";
const FOREIGN_URL = "https://evil.example/pay";

function fakeTab() {
  return { location: { href: "" }, opener: {} as unknown, closed: false, close: vi.fn() };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("reserveCheckoutProTab", () => {
  it("abre a aba no clique e corta o vínculo com a página da Papelito", () => {
    const tab = fakeTab();
    vi.spyOn(window, "open").mockReturnValue(tab as unknown as Window);

    expect(reserveCheckoutProTab()).not.toBeNull();
    expect(window.open).toHaveBeenCalledWith("", "_blank");
    expect(tab.opener).toBeNull();
  });

  it("pop-up bloqueado devolve null", () => {
    vi.spyOn(window, "open").mockReturnValue(null);

    expect(reserveCheckoutProTab()).toBeNull();
  });
});

describe("redirectToCheckoutPro", () => {
  it("com aba reservada, leva só a aba nova ao Mercado Pago", () => {
    const tab = fakeTab();
    vi.spyOn(window, "open").mockReturnValue(tab as unknown as Window);

    expect(redirectToCheckoutPro(MP_URL, reserveCheckoutProTab())).toBe("tab");
    expect(tab.location.href).toBe(MP_URL);
  });

  it("URL fora do Mercado Pago fecha a aba reservada e não navega", () => {
    const tab = fakeTab();
    vi.spyOn(window, "open").mockReturnValue(tab as unknown as Window);

    expect(redirectToCheckoutPro(FOREIGN_URL, reserveCheckoutProTab())).toBe("blocked");
    expect(tab.close).toHaveBeenCalled();
    expect(tab.location.href).toBe("");
  });

  it("sem aba (pop-up bloqueado) segue na aba atual", () => {
    const assign = vi.fn();
    vi.spyOn(window, "location", "get").mockReturnValue({ ...window.location, assign } as Location);

    expect(redirectToCheckoutPro(MP_URL, null)).toBe("same_tab");
    expect(assign).toHaveBeenCalledWith(MP_URL);
  });
});
