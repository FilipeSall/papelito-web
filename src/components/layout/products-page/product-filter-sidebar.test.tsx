import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ProductFilterSidebar } from "./product-filter-sidebar";

function renderSidebar(variant: "default" | "collection") {
  render(
    <ProductFilterSidebar
      selectedTypes={[]}
      viewMode="grid"
      perPage={9}
      variant={variant}
    />,
  );
}

describe("ProductFilterSidebar", () => {
  it("usa o acabamento de coleção com bordas quadradas", () => {
    renderSidebar("collection");

    expect(screen.getByText("Filtros").parentElement).toHaveClass(
      "border-2",
      "border-[#1a1a1a]",
      "rounded-none",
    );
    expect(screen.getByPlaceholderText("Min")).toHaveClass("border-2", "rounded-none");
    expect(screen.getByRole("button", { name: "Aplicar preço" })).toHaveClass(
      "border-2",
      "rounded-none",
    );
  });

  it("mantém o acabamento padrão do catálogo", () => {
    renderSidebar("default");

    expect(screen.getByText("Filtros").parentElement).toHaveClass("rounded-xl");
    expect(screen.getByPlaceholderText("Min")).toHaveClass("rounded-lg");
    expect(screen.getByRole("button", { name: "Aplicar preço" })).toHaveClass("rounded-lg");
  });
});
