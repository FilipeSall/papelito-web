import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { VendorContactCustomerButton } from "./vendor-contact-customer-button";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }) }));

describe("VendorContactCustomerButton", () => {
  it("abre o chamado a partir do pedido, sem mandar procurar na lista", () => {
    render(<VendorContactCustomerButton orderId={42} />);

    expect(
      screen.getByRole("button", { name: /abrir chamado com o cliente/i }),
    ).toBeInTheDocument();
  });

  it("leva aos chamados já existentes do pedido", () => {
    render(<VendorContactCustomerButton orderId={42} />);

    expect(screen.getByRole("link", { name: /ver chamados deste pedido/i })).toHaveAttribute(
      "href",
      "/vendor/chamados?pedido=42",
    );
  });

  it("mantém os rótulos visíveis em vez de escondê-los num tooltip", () => {
    render(<VendorContactCustomerButton orderId={1} />);

    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
    expect(screen.getByRole("link")).toHaveTextContent(/ver chamados deste pedido/i);
  });
});
