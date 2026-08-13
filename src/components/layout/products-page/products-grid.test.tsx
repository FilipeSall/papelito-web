import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ProductsGrid } from "./products-grid";

vi.mock("./product-grid-card", () => ({
  ProductGridCard: () => <div />,
}));

const product = {
  id: "1",
  category: "Sedas",
  name: "Produto",
  badge: "Novo",
  originalPrice: 12,
  price: 10,
};

function renderCollectionGrid(activeCollection: "todos" | "kits") {
  const { container } = render(
    <ProductsGrid
      activeCollection={activeCollection}
      products={[product]}
      variant="collection"
      viewMode="grid"
    />,
  );

  return container.firstElementChild;
}

describe("ProductsGrid", () => {
  it("limita Tudo a três colunas na variante de coleção", () => {
    expect(renderCollectionGrid("todos")).toHaveClass("sm:grid-cols-3");
    expect(renderCollectionGrid("todos")).not.toHaveClass("lg:grid-cols-4");
  });

  it("mantém quatro colunas para coleções específicas", () => {
    expect(renderCollectionGrid("kits")).toHaveClass("lg:grid-cols-4");
  });
});
