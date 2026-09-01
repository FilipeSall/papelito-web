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
        screen.getByText("Carregando opções de entrega...", { selector: "p" }),
      ).toBeInTheDocument();
    });
    expect(screen.getByRole("button", { name: /próximo: pagamento/i })).toBeDisabled();

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
        screen.queryByText("Carregando opções de entrega...", { selector: "p" }),
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
        screen.getByText("Carregando opções de entrega...", { selector: "p" }),
      ).toBeInTheDocument();
    });

    resolveQuote(
      HttpResponse.json(
        {
          message: "Não foi possível cotar o frete.",
        },
        { status: 502 },
      ),
    );

    await waitFor(() => {
      expect(screen.getByText("Não foi possível cotar o frete.")).toBeInTheDocument();
    });

    expect(
      screen.queryByText("Carregando opções de entrega...", { selector: "p" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /próximo: pagamento/i }),
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

    const advanceButton = screen.getByRole("button", { name: /próximo: pagamento/i });
    expect(advanceButton).toBeDisabled();

    await userEvent.click(screen.getByRole("radio", { name: /PAC.*R\$ 15,88/i }));

    expect(advanceButton).toBeEnabled();
    expect(screen.getAllByText("R$ 15,88").length).toBeGreaterThan(0);
    expect(await screen.findByText("R$ 65,38")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("radio", { name: /SEDEX.*R\$ 22,30/i }));

    expect(screen.getByRole("radio", { name: /SEDEX/i })).toBeChecked();
    expect(screen.getByRole("radio", { name: /PAC/i })).not.toBeChecked();

    expect(screen.getAllByText("R$ 22,30").length).toBeGreaterThan(0);
    expect(await screen.findByText("R$ 71,80")).toBeInTheDocument();
  });

  it("crosses out every shipping price and labels it free when the automatic minimum is reached", async () => {
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

    renderWithProviders(
      <CheckoutAddressStepContent freeShippingMinimumCents={4900} />,
    );

    await waitFor(() => {
      expect(screen.getByText("PAC Contrato")).toBeInTheDocument();
    });

    const freeShippingLabels = screen.getAllByText("Frete grátis");
    expect(freeShippingLabels).toHaveLength(2);
    for (const label of freeShippingLabels) {
      expect(label).toHaveClass("animate-free-shipping");
    }
    expect(screen.getByText("R$ 15,88", { selector: "del" })).toBeInTheDocument();
    expect(screen.getByText("R$ 22,30", { selector: "del" })).toBeInTheDocument();
  });

  it("hides the company CEP shortcut when the company has no registered CEP", () => {
    server.use(
      http.post(shippingQuoteUrl, () =>
        HttpResponse.json({
          origin_cep: "01001-000",
          destination_cep: "01310930",
          vendor_id: 101,
          options: [],
        }),
      ),
    );

    renderWithProviders(
      <CheckoutAddressStepContent
        company={{ legalName: "Cerrado Papeis", cnpj: "99999003000148", zipCode: null }}
      />,
    );

    expect(
      screen.queryByRole("button", { name: /cep do cadastro da empresa/i }),
    ).not.toBeInTheDocument();
  });

  it("fills the CEP from the company registry and autocompletes the address", async () => {
    server.use(
      http.post(shippingQuoteUrl, () =>
        HttpResponse.json({
          origin_cep: "01001-000",
          destination_cep: "71200030",
          vendor_id: 101,
          options: [],
        }),
      ),
      http.get("https://viacep.com.br/ws/71200030/json/", () =>
        HttpResponse.json({
          logradouro: "SHCES Quadra 401",
          bairro: "Cruzeiro Novo",
          localidade: "Brasilia",
          uf: "DF",
        }),
      ),
    );

    useCheckoutStore.setState({
      addressForm: {
        zipCode: "",
        street: "",
        number: "",
        complement: "",
        neighborhood: "",
        city: "",
        state: "",
      },
    });

    renderWithProviders(
      <CheckoutAddressStepContent
        company={{
          legalName: "Cerrado Papeis",
          cnpj: "99999003000148",
          zipCode: "71200030",
        }}
      />,
    );

    await userEvent.click(
      screen.getByRole("button", { name: /usar o cep do cadastro da empresa/i }),
    );

    await waitFor(() => {
      expect(useCheckoutStore.getState().addressForm.zipCode).toBe("71200-030");
      expect(useCheckoutStore.getState().addressForm.city).toBe("Brasilia");
      expect(useCheckoutStore.getState().addressForm.state).toBe("DF");
    });

    expect(
      await screen.findByRole("button", {
        name: /cep do cadastro da empresa ja aplicado|cep do cadastro da empresa já aplicado/i,
      }),
    ).toBeDisabled();
  });

  it("labels the company CEP shortcut with an icon button and a hover tooltip", () => {
    server.use(
      http.post(shippingQuoteUrl, () =>
        HttpResponse.json({
          origin_cep: "01001-000",
          destination_cep: "01310930",
          vendor_id: 101,
          options: [],
        }),
      ),
    );

    renderWithProviders(
      <CheckoutAddressStepContent
        company={{
          legalName: "Cerrado Papeis",
          cnpj: "99999003000148",
          zipCode: "71200030",
        }}
      />,
    );

    const shortcut = screen.getByRole("button", {
      name: /usar o cep do cadastro da empresa: 71200-030/i,
    });

    expect(shortcut).toHaveTextContent("");
    expect(shortcut.querySelector("svg")).toBeInTheDocument();
    expect(screen.getByRole("tooltip", { hidden: true })).toHaveTextContent(
      "Usar CEP da empresa",
    );
  });

  it("formats the company CNPJ in the buying-on-behalf-of header", () => {
    server.use(
      http.post(shippingQuoteUrl, () =>
        HttpResponse.json({
          origin_cep: "01001-000",
          destination_cep: "01310930",
          vendor_id: 101,
          options: [],
        }),
      ),
    );

    renderWithProviders(
      <CheckoutAddressStepContent
        company={{
          legalName: "CERRADO PAPEIS E SUPRIMENTOS LTDA",
          cnpj: "99999003000148",
          zipCode: null,
        }}
      />,
    );

    expect(screen.getByText("CNPJ 99.999.003/0001-48")).toBeInTheDocument();
    expect(screen.getByText("Comprando em nome de")).toBeInTheDocument();
  });
});
