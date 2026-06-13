import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { VendorContactCustomerButton } from "./vendor-contact-customer-button";

describe("VendorContactCustomerButton", () => {
  it("links to the order support thread", () => {
    render(<VendorContactCustomerButton orderId={42} />);

    const link = screen.getByRole("link", { name: /entrar em contato com o cliente/i });
    expect(link).toHaveAttribute("href", "/vendor/pedidos/42/suporte");
  });

  it("exposes the contact label as a tooltip", () => {
    render(<VendorContactCustomerButton orderId={1} />);

    const tooltip = screen.getByRole("tooltip");
    expect(tooltip).toHaveTextContent("Entrar em contato com o cliente");
  });
});
