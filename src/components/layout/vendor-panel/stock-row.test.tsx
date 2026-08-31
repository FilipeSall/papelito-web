import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { StockRow } from "./stock-row";
import { formatStockUpdatedAt } from "./stock-cells";
import type { VendorStockItem } from "@/features/vendor-stock/types/vendor-stock";

const baseItem: VendorStockItem = {
  categories: [{ id: 1, name: "Sedas", slug: "sedas" }],
  imageUrl: "",
  isPubliclyViewable: true,
  isZeroed: false,
  kit: null,
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

function renderRow(item: VendorStockItem) {
  return render(
    <table>
      <tbody>
        <StockRow
          focused={false}
          item={item}
          onQtyChange={() => {}}
          qty={String(item.qty)}
          saving={false}
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

  it("warns the vendor to configure the weight when not publicly viewable", () => {
    renderRow({ ...baseItem, isPubliclyViewable: false });
    expect(screen.getByTestId("stock-row-unpublishable")).toHaveTextContent(/peso/i);
  });
});
