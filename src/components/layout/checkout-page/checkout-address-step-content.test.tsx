import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useCartStore } from "@/features/cart";
import { useCheckoutStore } from "@/features/checkout";
import { server } from "../../../../test/msw/server";
import { buildCartItem } from "../../../../test/factories/cart";
import { renderWithProviders } from "../../../../test/utils/render-with-providers";
import { CheckoutAddressStepContent } from "./checkout-address-step-content";

const pushMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

vi.mock("next/image", () => ({
  default: () => null,
}));

const shippingQuoteUrl = "/api/checkout/shipping-quote";

function seedCheckoutState() {
  useCartStore.setState({
    items: [buildCartItem()],
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
    paymentMethod: "credit_card",
    paymentForm: {
      holderName: "",
      installments: "",
      cardTokenId: "",
      cardLast4: "",
    },
    shippingQuote: {
      quote: null,
      selectedOption: null,
    },
  });
}

describe("CheckoutAddressStepContent", () => {
  beforeEach(() => {
    pushMock.mockReset();
    seedCheckoutState();
  });

  it("shows a compact loader while shipping options are loading", async () => {
    let resolveQuote: (response: Response) => void = () => {
      throw new Error("Shipping quote resolver was used before initialization.");
    };

    server.use(
      http.post(
        shippingQuoteUrl,
        async () =>
          new Promise<Response>((resolve) => {
            resolveQuote = resolve;
          }),
      ),
    );

    renderWithProviders(<CheckoutAddressStepContent />);

    await waitFor(() => {
      expect(
        screen.getByText("Carregando opcoes de entrega...", { selector: "p" }),
      ).toBeInTheDocument();
    });
    expect(screen.getByRole("button", { name: /proximo: pagamento/i })).toBeDisabled();

    resolveQuote(
      HttpResponse.json({
        origin_cep: "01001-000",
        destination_cep: "01310930",
        vendor_id: 101,
        options: [
          {
            service: "PAC",
            code: "03298",
            name: "PAC Contrato",
            price: 15.88,
            delivery_time: 5,
          },
        ],
      }),
    );

    await waitFor(() => {
      expect(
        screen.queryByText("Carregando opcoes de entrega...", { selector: "p" }),
      ).not.toBeInTheDocument();
    });

    expect(screen.getByText("PAC Contrato")).toBeInTheDocument();
  });

  it("removes the loader and shows an error when shipping quote fails", async () => {
    let resolveQuote: (response: Response) => void = () => {
      throw new Error("Shipping quote resolver was used before initialization.");
    };

    server.use(
      http.post(
        shippingQuoteUrl,
        async () =>
          new Promise<Response>((resolve) => {
            resolveQuote = resolve;
          }),
      ),
    );

    renderWithProviders(<CheckoutAddressStepContent />);

    await waitFor(() => {
      expect(
        screen.getByText("Carregando opcoes de entrega...", { selector: "p" }),
      ).toBeInTheDocument();
    });

    resolveQuote(
      HttpResponse.json(
        {
          message: "Nao foi possivel cotar o frete.",
        },
        { status: 502 },
      ),
    );

    await waitFor(() => {
      expect(screen.getByText("Nao foi possivel cotar o frete.")).toBeInTheDocument();
    });

    expect(
      screen.queryByText("Carregando opcoes de entrega...", { selector: "p" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /proximo: pagamento/i }),
    ).toBeDisabled();
  });

  it("requires selecting PAC or SEDEX and updates the order summary with the selected freight", async () => {
    server.use(
      http.post(shippingQuoteUrl, () =>
        HttpResponse.json({
          origin_cep: "01001-000",
          destination_cep: "01310930",
          vendor_id: 101,
          options: [
            {
              service: "PAC",
              code: "03298",
              name: "PAC Contrato",
              price: 15.88,
              delivery_time: 5,
            },
            {
              service: "SEDEX",
              code: "03220",
              name: "SEDEX Contrato",
              price: 22.3,
              delivery_time: 2,
            },
          ],
        }),
      ),
    );

    renderWithProviders(<CheckoutAddressStepContent />);

    await waitFor(() => {
      expect(screen.getByText("PAC Contrato")).toBeInTheDocument();
      expect(screen.getByText("SEDEX Contrato")).toBeInTheDocument();
    });

    const advanceButton = screen.getByRole("button", { name: /proximo: pagamento/i });
    expect(advanceButton).toBeDisabled();

    await userEvent.click(screen.getByRole("button", { name: /PAC.*R\$ 15,88/i }));

    expect(advanceButton).toBeEnabled();
    expect(screen.getAllByText("R$ 15,88").length).toBeGreaterThan(0);
    expect(await screen.findByText("R$ 65,38")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /SEDEX.*R\$ 22,30/i }));

    expect(screen.getAllByText("R$ 22,30").length).toBeGreaterThan(0);
    expect(await screen.findByText("R$ 71,80")).toBeInTheDocument();
  });
});
