import { screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useCartStore } from "@/features/cart";
import { useCheckoutStore } from "@/features/checkout";
import { buildCartItem } from "../../../../test/factories/cart";
import { server } from "../../../../test/msw/server";
import { renderWithProviders } from "../../../../test/utils/render-with-providers";
import { CheckoutPaymentStepContent } from "./checkout-payment-step-content";

const pushMock = vi.fn();
const replaceMock = vi.fn();
const session = {
  user: { id: "3" },
  expires: "2099-01-01T00:00:00.000Z",
  b2b: { canPurchase: true, companyId: 10, purchaseMode: "b2b" as const },
};

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: pushMock, replace: replaceMock }) }));
vi.mock("next/image", () => ({ default: () => null }));

function respondWithContext(body: Record<string, unknown>, status = 200) {
  server.use(http.post("/api/checkout/payment-context", () => HttpResponse.json(body, { status })));
}

describe("CheckoutPaymentStepContent", () => {
  beforeEach(() => {
    pushMock.mockReset();
    replaceMock.mockReset();
    useCheckoutStore.getState().resetCheckout();
    useCartStore.setState({ items: [buildCartItem({ id: "11883", quantity: 1 })], coupon: null });
  });

  it("no Mercado Pago pula a etapa vazia e segue direto para a revisão", async () => {
    respondWithContext({ provider: "mercadopago", flow: "redirect", configurationVersion: "v1", fallbackReason: "" });

    renderWithProviders(<CheckoutPaymentStepContent />, { session });

    await waitFor(() => expect(replaceMock).toHaveBeenCalledWith("/checkout/revisao"));
    expect(useCheckoutStore.getState().paymentProvider).toBe("mercadopago");
    expect(useCheckoutStore.getState().paymentForm.cardTokenId).toBe("");
    expect(screen.queryByRole("button", { name: /próximo: revisão/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /cartao/i })).not.toBeInTheDocument();
  });

  it("na Pagar.me mostra os meios de sempre", async () => {
    respondWithContext({ provider: "pagarme", flow: "direct", configurationVersion: "", fallbackReason: "" });

    renderWithProviders(<CheckoutPaymentStepContent />, { session });

    expect(await screen.findByRole("button", { name: /pix/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /boleto/i })).toBeInTheDocument();
    expect(screen.queryByText("Pagamento pelo Mercado Pago")).not.toBeInTheDocument();
  });

  it("erro de contexto mostra a mensagem do catálogo e não oferece meio de pagamento", async () => {
    respondWithContext({ code: "papelito_payment_no_gateway_available", message: "x" }, 409);

    renderWithProviders(<CheckoutPaymentStepContent />, { session });

    expect(await screen.findByText("Nenhuma forma de pagamento está disponível para esta loja agora.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /pix/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /próximo: revisão/i })).not.toBeInTheDocument();
  });
});
