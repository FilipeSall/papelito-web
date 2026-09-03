import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { StockRow } from "./stock-row";
import { formatStockUpdatedAt } from "./stock-cells";
import type { VendorStockItem } from "@/features/vendor-stock/types/vendor-stock";

const baseItem: VendorStockItem = {
  categories: [{ id: 1, name: "Sedas", slug: "sedas" }],
  imageUrl: "",
  isPubliclyViewable: true,
  isUnconfigured: false,
  isZeroed: false,
  kit: null,
  missingFields: [],
  productId: 10,
  publicProductId: 8,
  productName: "Seda King Size",
  qty: 5,
  sku: "SK-1",
  tags: [
    { id: 2, name: "Combo", slug: "combo" },
    { id: 3, name: "Premium", slug: "premium" },
  ],
  updatedAt: "ontem",
};

function renderRow(item: VendorStockItem, lowStockThreshold = 5) {
  return render(
    <table>
      <tbody>
        <StockRow
          contactPhone="+55 61 99973-3064"
          focused={false}
          item={item}
          lowStockThreshold={lowStockThreshold}
          onQtyChange={() => {}}
          onRequestData={vi.fn()}
          onToggle={vi.fn()}
          qty={String(item.qty)}
          requested={false}
          saved={false}
          saving={false}
          selected={false}
        />
      </tbody>
    </table>,
  );
}

describe("StockRow chips", () => {
  it("formats stock timestamps in São Paulo time", () => {
    expect(formatStockUpdatedAt("2026-09-01 01:30:00")).toContain("31/08/2026");
  });

  it("renders category and tag chips", () => {
    renderRow(baseItem);
    expect(screen.getByText("Sedas")).toBeInTheDocument();
    expect(screen.getByText("Combo")).toBeInTheDocument();
    expect(screen.getByText("Premium")).toBeInTheDocument();
  });

  it("renders no chip container when there are no terms", () => {
    renderRow({ ...baseItem, categories: [], tags: [] });
    expect(screen.queryByTestId("stock-row-terms")).not.toBeInTheDocument();
  });

  it("links to the public product id when it differs from the stock id", () => {
    renderRow(baseItem);
    expect(screen.getAllByRole("link", { name: /seda king size/i })[0]).toHaveAttribute(
      "href",
      "/produtos/8",
    );
  });

  it("does not link a product that is not publicly viewable", () => {
    renderRow({ ...baseItem, isPubliclyViewable: false });
    expect(screen.queryByRole("link", { name: /seda king size/i })).not.toBeInTheDocument();
    expect(screen.getByText("Seda King Size")).toBeInTheDocument();
  });

  it("still names the weight when the product is not publicly viewable", () => {
    renderRow({ ...baseItem, isPubliclyViewable: false, missingFields: ["weight"] });
    expect(screen.getByText(/faltando peso/i)).toBeInTheDocument();
  });
});

describe("StockRow situação", () => {
  it("separates never configured from run out of stock", () => {
    renderRow({ ...baseItem, isUnconfigured: true, isZeroed: true, qty: 0 });
    expect(screen.getByText("Não configurado")).toBeInTheDocument();

    renderRow({ ...baseItem, isZeroed: true, productId: 11, qty: 0 });
    expect(screen.getByText("Sem estoque")).toBeInTheDocument();
  });

  it("marks a positive balance at or under the threshold as low stock", () => {
    renderRow({ ...baseItem, qty: 5 }, 5);
    expect(screen.getByText("Estoque baixo")).toBeInTheDocument();
  });

  it("marks a balance above the threshold as in stock", () => {
    renderRow({ ...baseItem, qty: 6 }, 5);
    expect(screen.getByText("Em estoque")).toBeInTheDocument();
  });
});
