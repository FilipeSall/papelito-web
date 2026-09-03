import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

import { StockFilterDrawer } from "./stock-filter-drawer";
import type { VendorStockFilters, VendorStockTaxonomies } from "@/features/vendor-stock/types/vendor-stock";

const filters: VendorStockFilters = {
  category: null,
  collection: null,
  filter: "all",
  perPage: 20,
  search: "",
  sort: "name_asc",
  tags: [],
  type: "products",
};

const taxonomies: VendorStockTaxonomies = {
  categories: [{ id: 7, name: "Sedas", slug: "sedas", count: 3 }],
  collections: [{ count: 4, name: "Premium", slug: "premium" }],
  tags: [
    { id: 12, name: "Combo", slug: "combo", count: 4 },
    { id: 45, name: "Premium", slug: "premium", count: 2 },
  ],
};

function selectField(label: string) {
  const field = screen.getByText(label).parentElement as HTMLElement;

  return {
    choose(optionName: RegExp) {
      fireEvent.click(within(field).getByRole("button"));
      fireEvent.click(within(field).getByRole("button", { name: optionName }));
    },
    field,
  };
}

describe("StockFilterDrawer", () => {
  beforeEach(() => push.mockClear());

  it("does not render the panel when closed", () => {
    render(<StockFilterDrawer filters={filters} onClose={() => {}} open={false} taxonomies={taxonomies} />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("navigates with selected category and tags on apply", () => {
    render(<StockFilterDrawer filters={filters} onClose={() => {}} open taxonomies={taxonomies} />);

    fireEvent.click(screen.getByRole("button", { name: "Combo" }));
    selectField("Categoria").choose(/sedas/i);
    fireEvent.click(screen.getByRole("button", { name: /^filtrar$/i }));

    expect(push).toHaveBeenCalledWith("/vendor/estoque?filter=all&category=7&tags=12");
  });

  it("starts the collection field on Todas", () => {
    render(<StockFilterDrawer filters={filters} onClose={() => {}} open taxonomies={taxonomies} />);

    const { field } = selectField("Coleção");
    expect(within(field).getByRole("button")).toHaveTextContent("Todas");
  });

  it("combines the collection with category, stock status and sort", () => {
    render(<StockFilterDrawer filters={filters} onClose={() => {}} open taxonomies={taxonomies} />);

    selectField("Ordenar por").choose(/maior estoque/i);
    selectField("Categoria").choose(/sedas/i);
    selectField("Coleção").choose(/premium/i);
    fireEvent.click(screen.getByRole("button", { name: /^em estoque$/i }));
    fireEvent.click(screen.getByRole("button", { name: /^filtrar$/i }));

    expect(push).toHaveBeenCalledWith(
      "/vendor/estoque?filter=with_stock&category=7&collection=premium&sort=qty_desc",
    );
  });

  it("filters to kits only", () => {
    render(<StockFilterDrawer filters={filters} onClose={() => {}} open taxonomies={taxonomies} />);

    selectField("Tipo").choose(/^kits$/i);
    fireEvent.click(screen.getByRole("button", { name: /^filtrar$/i }));

    expect(push).toHaveBeenCalledWith("/vendor/estoque?filter=all&type=kits");
  });

  it("combines the type with collection, category and stock status", () => {
    render(<StockFilterDrawer filters={filters} onClose={() => {}} open taxonomies={taxonomies} />);

    selectField("Categoria").choose(/sedas/i);
    selectField("Coleção").choose(/premium/i);
    selectField("Tipo").choose(/^kits$/i);
    fireEvent.click(screen.getByRole("button", { name: /^em estoque$/i }));
    fireEvent.click(screen.getByRole("button", { name: /^filtrar$/i }));

    expect(push).toHaveBeenCalledWith(
      "/vendor/estoque?filter=with_stock&category=7&collection=premium&type=kits",
    );
  });

  it("clears to defaults, collection included", () => {
    render(
      <StockFilterDrawer
        filters={{ ...filters, category: 7, collection: "premium", tags: [12], sort: "qty_desc", type: "kits" }}
        onClose={() => {}}
        open
        taxonomies={taxonomies}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /limpar filtros/i }));
    expect(push).toHaveBeenCalledWith("/vendor/estoque?filter=all");
  });

  it("offers only Produtos and Kits as mutually exclusive types", () => {
    render(<StockFilterDrawer filters={filters} onClose={() => {}} open taxonomies={taxonomies} />);

    const { field } = selectField("Tipo");
    fireEvent.click(within(field).getByRole("button"));

    expect(within(field).getAllByRole("option").map((option) => option.textContent)).toEqual([
      "Produtos",
      "Kits",
    ]);
  });

  it("hides the collection field when there is no curated collection", () => {
    render(
      <StockFilterDrawer
        filters={filters}
        onClose={() => {}}
        open
        taxonomies={{ ...taxonomies, collections: [] }}
      />,
    );
    expect(screen.queryByText("Coleção")).not.toBeInTheDocument();
  });

  it("hides the tags section when there are no tags", () => {
    render(
      <StockFilterDrawer
        filters={filters}
        onClose={() => {}}
        open
        taxonomies={{ ...taxonomies, tags: [] }}
      />,
    );
    expect(screen.queryByText(/^tags$/i)).not.toBeInTheDocument();
  });
});
