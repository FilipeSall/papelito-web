import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

import { StockToolbar } from "./stock-toolbar";
import type { VendorStockFilters, VendorStockTaxonomies } from "@/features/vendor-stock/types/vendor-stock";

const taxonomies: VendorStockTaxonomies = { categories: [], collections: [], tags: [] };

function renderToolbar(filters: Partial<VendorStockFilters> = {}) {
  const full: VendorStockFilters = {
    category: null,
    collection: null,
    filter: "all",
    perPage: 20,
    search: "",
    sort: "name_asc",
    tags: [],
    type: "products",
    ...filters,
  };
  return render(<StockToolbar filters={full} taxonomies={taxonomies} />);
}

describe("StockToolbar", () => {
  it("renders the search input and a Filtrar button", () => {
    renderToolbar();
    expect(screen.getByPlaceholderText(/nome do produto ou sku/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /filtrar/i })).toBeInTheDocument();
  });

  it("keeps the clear action inside the search field width", () => {
    renderToolbar({ search: "dichavador" });

    const searchInput = screen.getByRole("searchbox");
    expect(searchInput.parentElement?.parentElement).toHaveClass("max-w-md");
    expect(screen.getByRole("button", { name: "Limpar busca" })).toBeInTheDocument();
  });

  it("shows the active-filter count on the Filtrar button", () => {
    renderToolbar({ filter: "with_stock", category: 7, tags: [12, 45], sort: "qty_desc" });
    expect(screen.getByRole("button", { name: /filtrar · 5/i })).toBeInTheDocument();
  });

  it("counts the collection as an active filter", () => {
    renderToolbar({ collection: "premium" });
    expect(screen.getByRole("button", { name: /filtrar · 1/i })).toBeInTheDocument();
  });

  it("opens the drawer dialog when Filtrar is clicked", () => {
    renderToolbar();
    fireEvent.click(screen.getByRole("button", { name: /filtrar/i }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("applies a new sort as soon as an option is selected", () => {
    push.mockClear();
    renderToolbar();

    fireEvent.click(screen.getByRole("button", { name: "Nome (A-Z)" }));
    fireEvent.click(screen.getByRole("button", { name: "Menor estoque" }));

    expect(push).toHaveBeenCalledWith("/vendor/estoque?filter=all&sort=qty_asc");
  });

  it("shows feedback while the new sort is loading", () => {
    push.mockClear();
    renderToolbar();

    fireEvent.click(screen.getByRole("button", { name: "Nome (A-Z)" }));
    fireEvent.click(screen.getByRole("button", { name: "Maior estoque" }));

    expect(screen.getByLabelText("Atualizando ordenação")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Maior estoque/ })).toBeDisabled();
  });

  it("keeps feedback visible after applying filters closes the drawer", () => {
    renderToolbar();

    fireEvent.click(screen.getByRole("button", { name: /filtrar/i }));
    const typeField = screen.getByText("Tipo").parentElement as HTMLElement;
    fireEvent.click(within(typeField).getByRole("button"));
    fireEvent.click(within(typeField).getByRole("button", { name: /^kits$/i }));
    fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: /^filtrar$/i }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /aplicando filtros/i })).toBeDisabled();
    expect(screen.getByRole("status")).toHaveTextContent("Aplicando filtros…");
  });

  it("keeps active filters as hidden inputs in the search form", () => {
    const { container } = renderToolbar({ filter: "with_stock", category: 7, tags: [12, 45], sort: "qty_desc" });
    expect(container.querySelector('input[name="filter"][value="with_stock"]')).toBeTruthy();
    expect(container.querySelector('input[name="category"][value="7"]')).toBeTruthy();
    expect(container.querySelector('input[name="tags"][value="12,45"]')).toBeTruthy();
    expect(container.querySelector('input[name="sort"][value="qty_desc"]')).toBeTruthy();
  });

  it("keeps the selected collection as a hidden input in the search form", () => {
    const { container } = renderToolbar({ collection: "premium" });
    expect(container.querySelector('input[name="collection"][value="premium"]')).toBeTruthy();
  });
});
