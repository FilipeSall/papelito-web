import { screen, waitFor } from "@testing-library/react";
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
const eligibleB2bSession = {
	user: { id: "3" },
	expires: "2099-01-01T00:00:00.000Z",
	b2b: { canPurchase: true, companyId: 10, purchaseMode: "b2b" as const },
};

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

vi.mock("next/image", () => ({
  default: () => null,
}));

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
            service: "PAC",
            code: "03298",
            name: "PAC Contrato",
            price: 8.9,
            deliveryTime: 5,
          },
        ],
      },
      selectedOption: {
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
    seedCheckoutState();
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
        }),
      ),
    );

    const user = userEvent.setup();

    renderWithProviders(<CheckoutReviewStepContent />, { session: eligibleB2bSession });

    await user.click(screen.getByRole("button", { name: /finalizar pedido/i }));

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
        "Selecione uma opcao de frete valida antes de finalizar.",
      ),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(
        "Complete os dados de endereco e pagamento para finalizar o pedido.",
      ),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(
        "Revise a cotacao de frete antes de concluir o pedido.",
      ),
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

    await user.click(screen.getByRole("button", { name: /finalizar pedido/i }));

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

    await user.click(screen.getByRole("button", { name: /finalizar pedido/i }));

    expect(await screen.findByText("Gateway indisponivel.")).toBeInTheDocument();
    expect(useCartStore.getState().items).toHaveLength(1);
    expect(pushMock).not.toHaveBeenCalled();
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
        });
      }),
    );
    const user = userEvent.setup();

    renderWithProviders(<CheckoutReviewStepContent />, { session: eligibleB2bSession });

    const button = screen.getByRole("button", { name: /finalizar pedido/i });
    await user.dblClick(button);

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith("/checkout/pagamento/11883");
    });
    expect(placeOrderCalls).toBe(1);
  });
});
