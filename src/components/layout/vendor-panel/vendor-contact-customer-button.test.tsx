import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { VendorContactCustomerButton } from "./vendor-contact-customer-button";

describe("VendorContactCustomerButton", () => {
  it("links to the order support thread", () => {
    render(<VendorContactCustomerButton orderId={42} />);

    const link = screen.getByRole("link", { name: /entrar em contato com o cliente/i });
    expect(link).toHaveAttribute("href", "/vendor/pedidos/42/suporte");
  });

  it("keeps the label visible instead of hiding it in a tooltip", () => {
    render(<VendorContactCustomerButton orderId={1} />);

    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
    expect(screen.getByRole("link")).toHaveTextContent(/entrar em contato com o cliente/i);
  });
});
