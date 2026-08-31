import { describe, expect, it } from "vitest";

import { buildStockHref } from "./stock-href";

describe("buildStockHref", () => {
  it("omits defaults and only sets non-empty params", () => {
    expect(buildStockHref({ filter: "all", search: "", sort: "name_asc", category: null, collection: null, tags: [], type: "products" })).toBe(
      "/vendor/estoque?filter=all",
    );
  });

  it("serializes search, category, tags (csv), sort and page", () => {
    const href = buildStockHref(
      { filter: "with_stock", search: "seda", sort: "qty_desc", category: 7, collection: null, tags: [12, 45], type: "products" },
      3,
    );
    expect(href).toBe(
      "/vendor/estoque?filter=with_stock&search=seda&category=7&tags=12%2C45&sort=qty_desc&page=3",
    );
  });

  it("serializes the collection alongside the other filters", () => {
    const href = buildStockHref({
      category: 7,
      collection: "premium",
      filter: "with_stock",
      search: "",
      sort: "name_asc",
      tags: [],
      type: "products",
    });
    expect(href).toBe("/vendor/estoque?filter=with_stock&category=7&collection=premium");
  });

  it("serializes kits and omits the default products type", () => {
    const base = {
      category: null,
      collection: null,
      filter: "all" as const,
      search: "",
      sort: "name_asc" as const,
      tags: [],
    };
    expect(buildStockHref({ ...base, type: "kits" })).toBe("/vendor/estoque?filter=all&type=kits");
    expect(buildStockHref({ ...base, type: "products" })).toBe("/vendor/estoque?filter=all");
  });

  it("omits sort when name_asc and page when 1", () => {
    const href = buildStockHref({ filter: "all", search: "", sort: "name_asc", category: null, collection: null, tags: [], type: "products" }, 1);
    expect(href).toBe("/vendor/estoque?filter=all");
  });
});
