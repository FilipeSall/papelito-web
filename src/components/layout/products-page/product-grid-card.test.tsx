import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ProductGridCard } from "./product-grid-card";
import { ProductListCard } from "./product-list-card";

vi.mock("@/components/ui", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/components/ui")>()),
  AddToCartButton: () => <button type="button">Adicionar</button>,
}));

vi.mock("./product-list-cart-controls", () => ({
  ProductListCartControls: () => <button type="button">Adicionar</button>,
}));

vi.mock("@/features/catalog/hooks/use-product-availability", () => ({
  useProductAvailability: () => ({
    isUnavailable: false,
    disabledReason: undefined,
    stockLabel: "Estoque por região",
  }),
}));

const baseProduct = {
  id: "1",
  category: "Filtros",
  name: "Filtro Bio Longo",
  badge: "Novo",
  image: "/images/produto.png",
};

describe("preço riscado nos cards da listagem", () => {
  it("não risca o preço quando não há promoção (regressão: recém chegados vinham riscados)", () => {
    render(
      <ProductGridCard product={{ ...baseProduct, originalPrice: 121, price: 121 }} />,
    );

    expect(screen.getAllByText("R$ 121,00")).toHaveLength(1);
    expect(document.querySelector(".line-through")).toBeNull();
  });

  it("risca o preço cheio quando há promoção real", () => {
    render(
      <ProductGridCard product={{ ...baseProduct, originalPrice: 121, price: 99 }} />,
    );

    expect(screen.getByText("R$ 99,00")).toBeInTheDocument();
    expect(screen.getByText("R$ 121,00")).toHaveClass("line-through");
  });

  it("preço cheio menor que o praticado também não vira promoção", () => {
    render(
      <ProductGridCard product={{ ...baseProduct, originalPrice: 90, price: 121 }} />,
    );

    expect(document.querySelector(".line-through")).toBeNull();
  });

  it("vale igual para a visualização em lista", () => {
    const { unmount } = render(
      <ProductListCard product={{ ...baseProduct, originalPrice: 121, price: 121 }} />,
    );

    expect(document.querySelector(".line-through")).toBeNull();
    unmount();

    render(<ProductListCard product={{ ...baseProduct, originalPrice: 121, price: 99 }} />);

    expect(screen.getByText("R$ 121,00")).toHaveClass("line-through");
  });
});
