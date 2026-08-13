import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ProductCollectionFilters } from "./product-collection-filters";

describe("ProductCollectionFilters", () => {
  it("descarta a faixa de preço ao trocar de coleção", () => {
    render(
      <ProductCollectionFilters
        activeCollection="todos"
        basePath="/produtos"
        perPage={24}
        viewMode="grid"
      />,
    );

    const kits = screen.getByRole("link", { name: /kits/i });

    expect(kits).toHaveAttribute("href", "/produtos?colecao=kits&perPage=24");
  });
});
