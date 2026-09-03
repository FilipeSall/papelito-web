import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { ProductFilters } from "@/types/admin-products-manager";

import { ProductsFilters } from "./products-filters";

const appliedFilters: ProductFilters = {
  category: "7",
  incomplete: "",
  search: "seda",
  status: "publish",
  stockStatus: "instock",
};

const categories = [{ archivedAt: null, id: 7, isActive: true, name: "Sedas" }] as never;

function renderFilters(overrides: Partial<Parameters<typeof ProductsFilters>[0]> = {}) {
  const onUpdateFilter = vi.fn();
  const onApply = vi.fn();

  render(
    <ProductsFilters
      appliedFilters={appliedFilters}
      categories={categories}
      filters={{ ...appliedFilters, status: "draft" }}
      isLoading={false}
      onApply={onApply}
      onCreateNew={vi.fn()}
      onUpdateFilter={onUpdateFilter}
      {...overrides}
    />,
  );

  return { onApply, onUpdateFilter };
}

describe("ProductsFilters", () => {
  it("descarta o rascunho abandonado ao abrir a gaveta", async () => {
    const user = userEvent.setup();
    const { onUpdateFilter } = renderFilters();

    await user.click(screen.getByRole("button", { name: /^Filtros/ }));

    expect(onUpdateFilter).toHaveBeenCalledWith("status", "publish");
    expect(onUpdateFilter).toHaveBeenCalledWith("category", "7");
    expect(onUpdateFilter).toHaveBeenCalledWith("stockStatus", "instock");
    expect(onUpdateFilter).toHaveBeenCalledWith("incomplete", "");
  });

  it("não mexe no rascunho ao fechar a gaveta", async () => {
    const user = userEvent.setup();
    const { onUpdateFilter } = renderFilters();
    const toggle = screen.getByRole("button", { name: /^Filtros/ });

    await user.click(toggle);
    onUpdateFilter.mockClear();
    await user.click(toggle);

    expect(onUpdateFilter).not.toHaveBeenCalled();
    expect(screen.queryByText("Filtrar catálogo")).not.toBeInTheDocument();
  });

  it("remove um chip sem aplicar outros filtros rascunhados", async () => {
    const user = userEvent.setup();
    const { onApply } = renderFilters();

    await user.click(screen.getByRole("button", { name: "Remover filtro Categoria" }));

    expect(onApply).toHaveBeenCalledWith({
      ...appliedFilters,
      category: "",
    });
  });
});
