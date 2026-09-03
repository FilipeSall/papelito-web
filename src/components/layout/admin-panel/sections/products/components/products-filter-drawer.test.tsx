import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { ProductFilters } from "@/types/admin-products-manager";

import { ProductsFilterDrawer } from "./products-filter-drawer";

const filters: ProductFilters = {
  category: "",
  incomplete: "",
  search: "seda",
  status: "",
  stockStatus: "",
};

const categories = [
  { archivedAt: null, id: 7, isActive: true, name: "Sedas" },
  { archivedAt: null, id: 9, isActive: false, name: "Arquivada" },
] as never;

function renderDrawer(overrides: Partial<Parameters<typeof ProductsFilterDrawer>[0]> = {}) {
  const props = {
    appliedFilters: filters,
    categories,
    filters,
    isLoading: false,
    onApply: vi.fn(),
    onClose: vi.fn(),
    onUpdateFilter: vi.fn(),
    open: true,
    ...overrides,
  };

  return { ...render(<ProductsFilterDrawer {...props} />), props };
}

describe("ProductsFilterDrawer", () => {
  it("não renderiza nada fechado", () => {
    renderDrawer({ open: false });

    expect(screen.queryByText("Filtrar catálogo")).not.toBeInTheDocument();
  });

  it("abre como diálogo lateral com o par Limpar/Filtrar", () => {
    renderDrawer();

    expect(screen.getByText("Filtrar catálogo")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Filtrar" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Limpar filtros" })).toBeInTheDocument();
  });

  it("não repete a separação por kits, que já tem segmento próprio", () => {
    renderDrawer();

    expect(screen.queryByRole("link", { name: /kits/i })).not.toBeInTheDocument();
    expect(screen.queryByText("Tipo")).not.toBeInTheDocument();
  });

  it("oferece o recorte de produtos incompletos", async () => {
    const user = userEvent.setup();
    const { props } = renderDrawer();

    await user.click(screen.getByRole("checkbox"));

    expect(props.onUpdateFilter).toHaveBeenCalledWith("incomplete", "1");
  });

  it("aplica o rascunho e fecha", async () => {
    const user = userEvent.setup();
    const { props } = renderDrawer({
      filters: { ...filters, status: "publish" },
    });

    await user.click(screen.getByRole("button", { name: "Filtrar" }));

    expect(props.onClose).toHaveBeenCalled();
    expect(props.onApply).toHaveBeenCalledWith(
      expect.objectContaining({ status: "publish" }),
    );
  });

  it("limpar preserva a busca já aplicada", async () => {
    const user = userEvent.setup();
    const { props } = renderDrawer();

    await user.click(screen.getByRole("button", { name: "Limpar filtros" }));

    expect(props.onApply).toHaveBeenCalledWith({
      category: "",
      incomplete: "",
      search: "seda",
      status: "",
      stockStatus: "",
    });
  });

  it("não oferece categoria arquivada como filtro", () => {
    renderDrawer();

    expect(screen.queryByText("Arquivada")).not.toBeInTheDocument();
  });
});
