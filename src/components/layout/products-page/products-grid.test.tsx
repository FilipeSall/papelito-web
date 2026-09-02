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

function renderGrid(gridLayout: "default" | "collection") {
  const { container } = render(
    <ProductsGrid products={[product]} gridLayout={gridLayout} viewMode="grid" />,
  );

  return container.firstElementChild;
}

describe("ProductsGrid", () => {
  it("mantém três colunas na listagem com sidebar", () => {
    expect(renderGrid("default")).toHaveClass("lg:grid-cols-3");
    expect(renderGrid("default")).not.toHaveClass("xl:grid-cols-4");
  });

  it("aproveita a largura cheia da coleção com uma quarta coluna", () => {
    expect(renderGrid("collection")).toHaveClass("lg:grid-cols-3", "xl:grid-cols-4");
  });

  it("usa o mesmo espaçamento de card das duas superfícies", () => {
    expect(renderGrid("default")).toHaveClass("gap-4", "grid-cols-1", "sm:grid-cols-2");
    expect(renderGrid("collection")).toHaveClass("gap-4", "grid-cols-1", "sm:grid-cols-2");
  });
});
