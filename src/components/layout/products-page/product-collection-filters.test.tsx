import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ProductCollectionFilters } from "./product-collection-filters";

describe("ProductCollectionFilters", () => {
  it("usa uma linha amarela discreta para a coleção selecionada", () => {
    render(
      <ProductCollectionFilters
        activeCollection="todos"
        basePath="/kits"
        perPage={9}
        viewMode="grid"
      />,
    );

    const tudo = screen.getByRole("link", { name: /tudo/i });

    expect(tudo).toHaveClass("bg-brand-dark", "after:bg-brand-yellow");
    expect(tudo).not.toHaveClass("shadow-[4px_4px_0px_#ffe500]");
  });

  it("escurece o subtítulo no hover para manter a leitura", () => {
    render(
      <ProductCollectionFilters
        activeCollection="todos"
        basePath="/kits"
        perPage={9}
        viewMode="grid"
      />,
    );

    expect(screen.getByText("Linha premium")).toHaveClass(
      "text-text-secondary",
      "group-hover:text-brand-dark",
    );
  });

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
