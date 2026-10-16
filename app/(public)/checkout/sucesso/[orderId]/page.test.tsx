import { beforeEach, describe, expect, it, vi } from "vitest";

const { getProfileOrderDetailMock, redirectMock } = vi.hoisted(() => ({
  getProfileOrderDetailMock: vi.fn(),
  redirectMock: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
}));

vi.mock("@/features/orders", () => ({ getProfileOrderDetail: getProfileOrderDetailMock }));
vi.mock("@/features/checkout/server/require-checkout-customer", () => ({ requireCheckoutCustomer: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: redirectMock, notFound: vi.fn() }));
vi.mock("@/components/layout/checkout-page/checkout-success-content", () => ({ CheckoutSuccessContent: () => null }));

import CheckoutSuccessPage from "./page";

function order(payment: Record<string, unknown>) {
  return { id: "51", payment: { methodLabel: "Mercado Pago", maskedLabel: "", ...payment } };
}

describe("CheckoutSuccessPage", () => {
  beforeEach(() => {
    redirectMock.mockClear();
  });

  it("pedido Mercado Pago ainda não pago volta para o acompanhamento do pagamento", async () => {
    getProfileOrderDetailMock.mockResolvedValue(order({ state: "pending", provider: "mercadopago", flow: "redirect" }));

    await expect(CheckoutSuccessPage({ params: Promise.resolve({ orderId: "51" }) })).rejects.toThrow(
      "NEXT_REDIRECT:/checkout/pagamento/51",
    );
  });

  it("pedido Mercado Pago pago pelo servidor mostra o sucesso", async () => {
    getProfileOrderDetailMock.mockResolvedValue(order({ state: "paid", provider: "mercadopago", flow: "redirect" }));

    await expect(CheckoutSuccessPage({ params: Promise.resolve({ orderId: "51" }) })).resolves.toBeTruthy();
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it("pedido Pagar.me sem PIX nem boleto pendente segue para o perfil", async () => {
    getProfileOrderDetailMock.mockResolvedValue(order({ state: "pending" }));

    await expect(CheckoutSuccessPage({ params: Promise.resolve({ orderId: "51" }) })).rejects.toThrow("NEXT_REDIRECT:/perfil/pedidos/51");
  });
});
