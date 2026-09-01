import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useCartStore } from "@/features/cart";
import { useCheckoutStore } from "@/features/checkout";
import { buildCartItem } from "../../../../test/factories/cart";
import { renderWithProviders } from "../../../../test/utils/render-with-providers";
import { CheckoutStepNav } from "./checkout-step-nav";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

function seedStores({ complete }: { complete: boolean }) {
  useCartStore.setState({ items: [buildCartItem()], coupon: null });

  useCheckoutStore.setState({
    addressForm: complete
      ? {
          zipCode: "01310-930",
          street: "Rua das Flores",
          number: "123",
          complement: "",
          neighborhood: "Centro",
          city: "Sao Paulo",
          state: "SP",
        }
      : {
          zipCode: "",
          street: "",
          number: "",
          complement: "",
          neighborhood: "",
          city: "",
          state: "",
        },
    paymentMethod: "credit_card",
    paymentForm: {
      holderName: "",
      installments: "",
      cardTokenId: complete ? "token_123" : "",
      cardLast4: "",
    },
    shippingQuote: {
      quote: null,
      selectedOption: complete
        ? { service: "PAC", code: "03298", name: "PAC", price: 15.88, deliveryTime: 5 }
        : null,
    },
  });
}

describe("CheckoutStepNav", () => {
  beforeEach(() => {
    seedStores({ complete: false });
  });

  it("exposes the steps as an ordered navigation landmark", () => {
    renderWithProviders(<CheckoutStepNav currentStep={1} />);

    expect(screen.getByRole("navigation", { name: "Etapas do checkout" })).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(3);
  });

  it("marks the current step and keeps it out of the link set", () => {
    renderWithProviders(<CheckoutStepNav currentStep={1} />);

    expect(screen.getByText("Endereço").closest("[aria-current]")).toHaveAttribute(
      "aria-current",
      "step",
    );
    expect(screen.queryByRole("link", { name: /endereço/i })).not.toBeInTheDocument();
  });

  it("does not link steps the buyer has not unlocked yet", () => {
    renderWithProviders(<CheckoutStepNav currentStep={1} />);

    expect(screen.queryByRole("link", { name: /pagamento/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /revisão/i })).not.toBeInTheDocument();
  });

  it("links forward once address, freight and card token are filled", async () => {
    seedStores({ complete: true });
    renderWithProviders(<CheckoutStepNav currentStep={1} />);

    expect(await screen.findByRole("link", { name: /pagamento/i })).toHaveAttribute(
      "href",
      "/checkout/pagamento",
    );
    expect(screen.getByRole("link", { name: /revisão/i })).toHaveAttribute(
      "href",
      "/checkout/revisao",
    );
  });

  it("always links back to a completed step, even with regressed data", async () => {
    renderWithProviders(<CheckoutStepNav currentStep={3} />);

    expect(await screen.findByRole("link", { name: /endereço/i })).toHaveAttribute(
      "href",
      "/checkout",
    );
    expect(screen.getByRole("link", { name: /pagamento/i })).toHaveAttribute(
      "href",
      "/checkout/pagamento",
    );
  });
});
