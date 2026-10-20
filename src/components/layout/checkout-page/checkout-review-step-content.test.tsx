import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useCartStore } from "@/features/cart";
import { useCheckoutStore } from "@/features/checkout";
import { server } from "../../../../test/msw/server";
import { buildCartItem } from "../../../../test/factories/cart";
import { renderWithProviders } from "../../../../test/utils/render-with-providers";
import { CheckoutReviewStepContent } from "./checkout-review-step-content";

const pushMock = vi.fn();
const { redirectMock } = vi.hoisted(() => ({ redirectMock: vi.fn() }));
const MP_URL = "https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=1-abc";
const eligibleB2bSession = {
	user: { id: "3" },
	expires: "2099-01-01T00:00:00.000Z",
	b2b: { canPurchase: true, companyId: 10, purchaseMode: "b2b" as const },
};
const validOrderTotals = {
  subtotalCents: 9000,
  discountCents: 0,
  itemsCents: 9000,
  shippingCents: 890,
  shippingDiscountCents: 0,
  totalCents: 9890,
};

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

vi.mock("next/image", () => ({
  default: () => null,
}));

const reserveTabMock = vi.hoisted(() => vi.fn());
const reservedTab = vi.hoisted(() => ({ navigate: vi.fn(), close: vi.fn() }));

vi.mock("@/features/checkout/utils/redirect-to-checkout-pro", () => ({
  redirectToCheckoutPro: redirectMock,
  reserveCheckoutProTab: reserveTabMock,
}));

function respondWithPaymentContext(provider: "mercadopago" | "pagarme") {
  server.use(
    http.post("/api/checkout/payment-context", () =>
      HttpResponse.json({ provider, flow: provider === "mercadopago" ? "redirect" : "direct", configurationVersion: "v1", fallbackReason: "" }),
    ),
  );
}

function seedCheckoutState() {
  useCartStore.setState({
    items: [
      buildCartItem({
        id: "11883",
        name: "Seda Slim Longa",
        price: 90,
        quantity: 1,
      }),
    ],
    coupon: null,
  });

  useCheckoutStore.setState({
    addressForm: {
      zipCode: "01310-930",
      street: "Rua das Flores",
      number: "123",
      complement: "",
      neighborhood: "Centro",
      city: "Sao Paulo",
      state: "SP",
    },
    paymentMethod: "pix",
    paymentForm: {
      holderName: "",
      installments: "",
      cardTokenId: "",
      cardLast4: "",
    },
    shippingQuote: {
      quote: {
        originCep: "01001000",
        destinationCep: "01310930",
        vendorId: 101,
        options: [
          {
            provider: "correios",
            optionKey: "correios:03298",
            fingerprint: "review-pac-quote",
            customerPriceCents: 890,
            expiresAt: null,
            service: "PAC",
            code: "03298",
            name: "PAC Contrato",
            price: 8.9,
            deliveryTime: 5,
          },
        ],
      },
      selectedOption: {
        provider: "correios",
        optionKey: "correios:03298",
        fingerprint: "review-pac-quote",
        customerPriceCents: 890,
        expiresAt: null,
        service: "PAC",
        code: "03298",
        name: "PAC Contrato",
        price: 8.9,
        deliveryTime: 5,
      },
    },
  });
}

describe("CheckoutReviewStepContent", () => {
  beforeEach(() => {
    pushMock.mockReset();
    redirectMock.mockReset();
    useCheckoutStore.getState().resetCheckout();
    seedCheckoutState();
    respondWithPaymentContext("pagarme");
  });

  it("clears the cart and keeps a loading state while redirecting to PIX", async () => {
    server.use(
      http.post("/api/checkout/place-order", () =>
        HttpResponse.json({
          orderId: 11883,
          orderNumber: "11883",
          status: "pending",
          payment: {
            method: "pix",
            state: "waiting_payment",
          },
          totals: validOrderTotals,
        }),
      ),
    );

    const user = userEvent.setup();

    renderWithProviders(<CheckoutReviewStepContent />, { session: eligibleB2bSession });

    await user.click(await screen.findByRole("button", { name: /finalizar pedido/i }));

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith("/checkout/pagamento/11883");
    });
    await waitFor(() => {
      expect(useCartStore.getState().items).toEqual([]);
    });
    await waitFor(() => {
      expect(useCheckoutStore.getState().addressForm.street).toBe("");
    });

    expect(screen.getByRole("status")).toHaveTextContent(
      "Processando pagamento",
    );
    expect(
      screen.queryByRole("button", { name: /finalizar pedido/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(
        "Selecione uma opção de frete válida antes de finalizar.",
      ),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(
        "Complete os dados de endereço e pagamento para finalizar o pedido.",
      ),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(
        "Revise a cotação de frete antes de concluir o pedido.",
      ),
    ).not.toBeInTheDocument();
  });

  it("names the carrier of the chosen option in the shipping summary", async () => {
    const braspressOption = {
      provider: "braspress" as const,
      optionKey: "braspress:rodoviario",
      serviceCode: "rodoviario",
      fingerprint: "review-rodoviario-quote",
      customerPriceCents: 890,
      expiresAt: null,
      service: "Rodoviário",
      code: "rodoviario",
      name: "Rodoviário",
      price: 8.9,
      deliveryTime: 3,
    };

    useCheckoutStore.setState({
      shippingQuote: {
        quote: {
          originCep: "01001000",
          destinationCep: "01310930",
          vendorId: 101,
          options: [braspressOption],
        },
        selectedOption: braspressOption,
      },
    });

    renderWithProviders(<CheckoutReviewStepContent />, { session: eligibleB2bSession });

    expect(await screen.findByText("Braspress")).toBeInTheDocument();
    expect(screen.getByText("Rodoviário")).toBeInTheDocument();
  });

  it("sends the customer back to the delivery step when the backend rejects a stale quote", async () => {
    server.use(
      http.post("/api/checkout/place-order", () =>
        HttpResponse.json(
          {
            code: "papelito_checkout_shipping_stale",
            message: "Selected shipping option is no longer valid.",
          },
          { status: 409 },
        ),
      ),
    );

    const user = userEvent.setup();

    renderWithProviders(<CheckoutReviewStepContent />, { session: eligibleB2bSession });

    await user.click(await screen.findByRole("button", { name: /finalizar pedido/i }));

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith("/checkout");
    });

    expect(useCheckoutStore.getState().shippingQuote.selectedOption).toBeNull();
    expect(useCheckoutStore.getState().requiresShippingReselection).toBe(true);
    expect(
      screen.queryByText("Selected shipping option is no longer valid."),
    ).not.toBeInTheDocument();
  });

  it("does not place the order when fresh stock is unavailable", async () => {
    let placeOrderCalls = 0;
    server.use(
      http.post("/api/cart/stock", () =>
        HttpResponse.json({
          status: "ok",
          products: {
            "11883": { available: false, stockQty: 0 },
          },
        }),
      ),
      http.post("/api/checkout/place-order", () => {
        placeOrderCalls += 1;
        return HttpResponse.json({});
      }),
    );
    const user = userEvent.setup();

    renderWithProviders(<CheckoutReviewStepContent />, { session: eligibleB2bSession });

    await user.click(await screen.findByRole("button", { name: /finalizar pedido/i }));

    expect(
      await screen.findByText(/volte ao carrinho para revisar/i),
    ).toBeInTheDocument();
    expect(placeOrderCalls).toBe(0);
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("preserves the cart when order placement fails before a consistent charge", async () => {
    server.use(
      http.post("/api/checkout/place-order", () =>
        HttpResponse.json(
          {
            code: "papelito_checkout_payment_unavailable",
            message: "Gateway indisponivel.",
          },
          { status: 502 },
        ),
      ),
    );
    const user = userEvent.setup();

    renderWithProviders(<CheckoutReviewStepContent />, { session: eligibleB2bSession });

    await user.click(await screen.findByRole("button", { name: /finalizar pedido/i }));

    expect(await screen.findByText("Gateway indisponivel.")).toBeInTheDocument();
    expect(useCartStore.getState().items).toHaveLength(1);
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("rotates the checkout attempt after a payload conflict", async () => {
    server.use(
      http.post("/api/checkout/place-order", () =>
        HttpResponse.json(
          {
            code: "papelito_checkout_attempt_payload_conflict",
            message: "Esta tentativa de checkout foi reutilizada com dados diferentes.",
          },
          { status: 409 },
        ),
      ),
    );
    const user = userEvent.setup();

    renderWithProviders(<CheckoutReviewStepContent />, { session: eligibleB2bSession });

    await screen.findByRole("button", { name: /finalizar pedido/i });
    await waitFor(() => {
      expect(useCheckoutStore.getState().checkoutAttemptFingerprint).toBeTruthy();
    });
    const previousAttemptId = useCheckoutStore.getState().checkoutAttemptId;

    await user.click(screen.getByRole("button", { name: /finalizar pedido/i }));

    expect(
      await screen.findByText("Esta tentativa de checkout foi reutilizada com dados diferentes.", {}, { timeout: 3000 }),
    ).toBeInTheDocument();
    expect(useCheckoutStore.getState().checkoutAttemptId).not.toBe(previousAttemptId);
  });

  it("submits only once when the finish button is clicked repeatedly", async () => {
    let placeOrderCalls = 0;
    server.use(
      http.post("/api/checkout/place-order", async () => {
        placeOrderCalls += 1;
        await new Promise((resolve) => setTimeout(resolve, 25));

        return HttpResponse.json({
          orderId: 11883,
          orderNumber: "11883",
          status: "pending",
          payment: {
            method: "pix",
            state: "waiting_payment",
          },
          totals: validOrderTotals,
        });
      }),
    );
    const user = userEvent.setup();

    renderWithProviders(<CheckoutReviewStepContent />, { session: eligibleB2bSession });

    const button = await screen.findByRole("button", { name: /finalizar pedido/i });
    await user.dblClick(button);

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith("/checkout/pagamento/11883");
    });
    expect(placeOrderCalls).toBe(1);
  });

  describe("Mercado Pago", () => {
    function respondPlaceOrder(payment: Record<string, unknown>, onCall?: (body: Record<string, unknown>) => void) {
      server.use(
        http.post("/api/checkout/place-order", async ({ request }) => {
          onCall?.((await request.json()) as Record<string, unknown>);
          await new Promise((resolve) => setTimeout(resolve, 20));
          return HttpResponse.json({ orderId: 77, orderNumber: "77", status: "pending", payment, totals: validOrderTotals });
        }),
      );
    }

    beforeEach(() => {
      respondWithPaymentContext("mercadopago");
      reserveTabMock.mockReset();
      reserveTabMock.mockReturnValue(reservedTab);
      reservedTab.close.mockReset();
      redirectMock.mockReset();
      redirectMock.mockReturnValue("tab");
    });

    it("mostra o Mercado Pago e envia o pedido sem pagamento antes de redirecionar", async () => {
      const bodies: Record<string, unknown>[] = [];
      respondPlaceOrder(
        { state: "pending", provider: "mercadopago", flow: "redirect", paymentAttemptId: 5, configurationVersion: "v1", fallbackReason: "", redirectUrl: MP_URL },
        (body) => bodies.push(body),
      );
      const user = userEvent.setup();

      renderWithProviders(<CheckoutReviewStepContent />, { session: eligibleB2bSession });

      const button = await screen.findByRole("button", { name: /continuar para o mercado pago/i });
      expect(screen.getByText("Mercado Pago")).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /finalizar pedido/i })).not.toBeInTheDocument();

      await user.dblClick(button);

      await waitFor(() => expect(redirectMock).toHaveBeenCalledWith(MP_URL, reservedTab), { timeout: 3000 });
      expect(reserveTabMock).toHaveBeenCalledTimes(1);
      expect(bodies).toHaveLength(1);
      expect(bodies[0]).not.toHaveProperty("payment");
      expect(useCartStore.getState().items).toEqual([]);
      expect(pushMock).toHaveBeenCalledWith("/checkout/pagamento/77");
    });

    it("pop-up bloqueado abre o Mercado Pago na própria aba, sem navegar a Papelito", async () => {
      reserveTabMock.mockReturnValue(null);
      redirectMock.mockReturnValue("same_tab");
      respondPlaceOrder({ state: "pending", provider: "mercadopago", flow: "redirect", paymentAttemptId: 5, configurationVersion: "v1", fallbackReason: "", redirectUrl: MP_URL });
      const user = userEvent.setup();

      renderWithProviders(<CheckoutReviewStepContent />, { session: eligibleB2bSession });
      await user.click(await screen.findByRole("button", { name: /continuar para o mercado pago/i }));

      await waitFor(() => expect(redirectMock).toHaveBeenCalledWith(MP_URL, null), { timeout: 3000 });
      expect(pushMock).not.toHaveBeenCalled();
    });

    it("sem etapa de pagamento, volta para o endereço e não oferece editar a forma de pagamento", async () => {
      renderWithProviders(<CheckoutReviewStepContent />, { session: eligibleB2bSession });

      await screen.findByRole("button", { name: /continuar para o mercado pago/i });
      expect(screen.getByRole("link", { name: /voltar para endereço/i })).toHaveAttribute("href", "/checkout");
      expect(screen.queryByRole("link", { name: /voltar para pagamento/i })).not.toBeInTheDocument();
      const paymentSection = screen.getByRole("heading", { name: /forma de pagamento/i }).closest("section");
      expect(paymentSection).not.toBeNull();
      expect(within(paymentSection as HTMLElement).queryByRole("link", { name: /editar/i })).not.toBeInTheDocument();
    });

    it("redirect fora do Mercado Pago não sai do site nem limpa o carrinho", async () => {
      respondPlaceOrder({ state: "pending", provider: "mercadopago", flow: "redirect", paymentAttemptId: 5, redirectUrl: "http://www.mercadopago.com.br/x" });
      const user = userEvent.setup();

      renderWithProviders(<CheckoutReviewStepContent />, { session: eligibleB2bSession });

      await user.click(await screen.findByRole("button", { name: /continuar para o mercado pago/i }));

      expect(await screen.findByText("Resposta inválida ao concluir o pedido.", {}, { timeout: 3000 })).toBeInTheDocument();
      expect(redirectMock).not.toHaveBeenCalled();
      expect(reservedTab.close).toHaveBeenCalled();
      expect(useCartStore.getState().items).toHaveLength(1);
    });

    it("guarda a tentativa e leva à coleta Pagar.me sem novo place-order", async () => {
      let calls = 0;
      respondPlaceOrder(
        { method: "", state: "awaiting_payment_input", provider: "pagarme", flow: "requires_payment_input", paymentAttemptId: 6, configurationVersion: "v2", fallbackReason: "preferred_failed_before_creation" },
        () => {
          calls += 1;
        },
      );
      const user = userEvent.setup();

      renderWithProviders(<CheckoutReviewStepContent />, { session: eligibleB2bSession });

      await user.click(await screen.findByRole("button", { name: /continuar para o mercado pago/i }));

      await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/checkout/pagamento/77"), { timeout: 3000 });
      expect(useCheckoutStore.getState().pendingPaymentAttempt).toEqual({ orderId: 77, paymentAttemptId: 6, configurationVersion: "v2" });
      expect(useCartStore.getState().items).toEqual([]);
      expect(redirectMock).not.toHaveBeenCalled();
      expect(calls).toBe(1);
    });

    it("pagamento em reconciliação leva ao pedido em vez de refazer o checkout", async () => {
      server.use(
        http.post("/api/checkout/place-order", () =>
          HttpResponse.json({ code: "papelito_payment_attempt_reconciling", message: "Estamos confirmando.", orderId: 88 }, { status: 409 }),
        ),
      );
      const user = userEvent.setup();

      renderWithProviders(<CheckoutReviewStepContent />, { session: eligibleB2bSession });

      await user.click(await screen.findByRole("button", { name: /continuar para o mercado pago/i }));

      await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/checkout/pagamento/88"), { timeout: 3000 });
      expect(useCartStore.getState().items).toEqual([]);
    });
  });

  it("erro de contexto bloqueia a finalização com a mensagem do catálogo", async () => {
    server.use(
      http.post("/api/checkout/payment-context", () =>
        HttpResponse.json({ code: "papelito_payment_vendor_suspended" }, { status: 409 }),
      ),
    );

    renderWithProviders(<CheckoutReviewStepContent />, { session: eligibleB2bSession });

    expect(await screen.findByText("Esta loja está sem pagamentos disponíveis no momento.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /finalizar pedido/i })).toBeDisabled();
  });
});
