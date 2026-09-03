import { describe, expect, it } from "vitest";

import { buildStockHref } from "./stock-href";
import type { VendorStockFilters } from "@/features/vendor-stock/types/vendor-stock";

const base: VendorStockFilters = {
  category: null,
  collection: null,
  filter: "all",
  perPage: 20,
  search: "",
  sort: "name_asc",
  tags: [],
  type: "products",
};

describe("buildStockHref", () => {
  it("omits defaults and only sets non-empty params", () => {
    expect(buildStockHref(base)).toBe("/vendor/estoque?filter=all");
  });

  it("serializes search, category, tags (csv), sort and page", () => {
    const href = buildStockHref(
      { ...base, category: 7, filter: "with_stock", search: "seda", sort: "qty_desc", tags: [12, 45] },
      3,
    );
    expect(href).toBe(
      "/vendor/estoque?filter=with_stock&search=seda&category=7&tags=12%2C45&sort=qty_desc&page=3",
    );
  });

  it("serializes the collection alongside the other filters", () => {
    const href = buildStockHref({
      ...base,
      category: 7,
      collection: "premium",
      filter: "with_stock",
    });
    expect(href).toBe("/vendor/estoque?filter=with_stock&category=7&collection=premium");
  });

  it("serializes kits and omits the default products type", () => {
    expect(buildStockHref({ ...base, type: "kits" })).toBe("/vendor/estoque?filter=all&type=kits");
    expect(buildStockHref({ ...base, type: "products" })).toBe("/vendor/estoque?filter=all");
  });

  it("omits sort when name_asc and page when 1", () => {
    expect(buildStockHref(base, 1)).toBe("/vendor/estoque?filter=all");
  });

  it("omits the default page size and serializes a chosen one", () => {
    expect(buildStockHref({ ...base, perPage: 20 })).toBe("/vendor/estoque?filter=all");
    expect(buildStockHref({ ...base, perPage: 50 })).toBe("/vendor/estoque?filter=all&per_page=50");
    expect(buildStockHref({ ...base, perPage: 100 })).toBe("/vendor/estoque?filter=all&per_page=100");
  });

  it("keeps the page size while filtering, sorting and paginating", () => {
    const href = buildStockHref({ ...base, filter: "low_stock", perPage: 100, sort: "qty_asc" }, 4);
    expect(href).toContain("per_page=100");
    expect(href).toContain("filter=low_stock");
    expect(href).toContain("page=4");
  });
});
