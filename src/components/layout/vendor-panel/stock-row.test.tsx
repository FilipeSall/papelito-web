import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { StockRow } from "./stock-row";
import type { VendorStockItem } from "@/features/vendor-stock/types/vendor-stock";

const baseItem: VendorStockItem = {
  categories: [{ id: 1, name: "Sedas", slug: "sedas" }],
  imageUrl: "",
  isZeroed: false,
  productId: 10,
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
          save={async () => {}}
          saving={false}
        />
      </tbody>
    </table>,
  );
}

describe("StockRow chips", () => {
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
});
