import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { RevendedorBenefitsSection } from "./revendedor-benefits-section";

describe("RevendedorBenefitsSection", () => {
  it("opens the catalog endpoint in a new tab", () => {
    render(<RevendedorBenefitsSection />);

    const link = screen.getByRole("link", { name: /Conheça nosso portfólio/i });

    expect(link).toHaveAttribute("href", "/api/catalog");
    expect(link).toHaveAttribute("target", "_blank");
  });
});
