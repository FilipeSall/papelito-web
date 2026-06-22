import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));

import { VendorStockManager } from "./vendor-stock-manager";
import type {
  VendorStockSnapshot,
  VendorStockTaxonomies,
} from "@/features/vendor-stock/types/vendor-stock";

const taxonomies: VendorStockTaxonomies = { categories: [], tags: [] };

const filters = {
  category: null,
  filter: "all" as const,
  search: "",
  sort: "name_asc" as const,
  tags: [],
};

const snapshot: VendorStockSnapshot = {
  items: [
    {
      categories: [],
      imageUrl: "",
      isPubliclyViewable: true,
      isZeroed: false,
      productId: 10,
      publicProductId: 10,
      productName: "Seda King Size",
      qty: 5,
      sku: "SK-1",
      tags: [],
      updatedAt: "ontem",
    },
  ],
  page: 1,
  perPage: 20,
  total: 1,
};

describe("VendorStockManager auto-save", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    refresh.mockClear();
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve({}) })),
    );
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("has no Salvar buttons", () => {
    render(<VendorStockManager filters={filters} snapshot={snapshot} taxonomies={taxonomies} />);
    expect(screen.queryByRole("button", { name: /salvar/i })).not.toBeInTheDocument();
  });

  it("debounces the PUT and sends the new quantity once", async () => {
    render(<VendorStockManager filters={filters} snapshot={snapshot} taxonomies={taxonomies} />);
    const input = screen.getByLabelText(/quantidade de seda king size/i);

    fireEvent.change(input, { target: { value: "1" } });
    fireEvent.change(input, { target: { value: "12" } });

    expect(fetch).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(800);

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith(
      "/api/vendor/stock",
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify({ product_id: 10, qty: 12 }),
      }),
    );
  });

  it("does not save when the value is unchanged from the snapshot", () => {
    render(<VendorStockManager filters={filters} snapshot={snapshot} taxonomies={taxonomies} />);
    const input = screen.getByLabelText(/quantidade de seda king size/i);

    fireEvent.change(input, { target: { value: "9" } });
    fireEvent.change(input, { target: { value: "5" } });
    vi.advanceTimersByTime(800);

    expect(fetch).not.toHaveBeenCalled();
  });
});
