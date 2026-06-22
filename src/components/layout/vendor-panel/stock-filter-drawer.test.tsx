import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

import { StockFilterDrawer } from "./stock-filter-drawer";
import type { VendorStockFilters, VendorStockTaxonomies } from "@/features/vendor-stock/types/vendor-stock";

const filters: VendorStockFilters = {
  category: null,
  filter: "all",
  search: "",
  sort: "name_asc",
  tags: [],
};

const taxonomies: VendorStockTaxonomies = {
  categories: [{ id: 7, name: "Sedas", slug: "sedas", count: 3 }],
  tags: [
    { id: 12, name: "Combo", slug: "combo", count: 4 },
    { id: 45, name: "Premium", slug: "premium", count: 2 },
  ],
};

describe("StockFilterDrawer", () => {
  beforeEach(() => push.mockClear());

  it("does not render the panel when closed", () => {
    render(<StockFilterDrawer filters={filters} onClose={() => {}} open={false} taxonomies={taxonomies} />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("navigates with selected category and tags on apply", () => {
    render(<StockFilterDrawer filters={filters} onClose={() => {}} open taxonomies={taxonomies} />);

    fireEvent.click(screen.getByRole("button", { name: "Combo" }));
    fireEvent.click(screen.getByRole("button", { name: /todas/i }));
    fireEvent.click(screen.getByRole("button", { name: /sedas/i }));
    fireEvent.click(screen.getByRole("button", { name: /^filtrar$/i }));

    expect(push).toHaveBeenCalledWith("/vendor/estoque?filter=all&category=7&tags=12");
  });

  it("clears to defaults", () => {
    render(
      <StockFilterDrawer
        filters={{ ...filters, category: 7, tags: [12], sort: "qty_desc" }}
        onClose={() => {}}
        open
        taxonomies={taxonomies}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /limpar filtros/i }));
    expect(push).toHaveBeenCalledWith("/vendor/estoque?filter=all");
  });

  it("hides the tags section when there are no tags", () => {
    render(
      <StockFilterDrawer
        filters={filters}
        onClose={() => {}}
        open
        taxonomies={{ categories: taxonomies.categories, tags: [] }}
      />,
    );
    expect(screen.queryByText(/^tags$/i)).not.toBeInTheDocument();
  });
});
