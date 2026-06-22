import { describe, expect, it } from "vitest";

import { buildStockHref } from "./stock-href";

describe("buildStockHref", () => {
  it("omits defaults and only sets non-empty params", () => {
    expect(buildStockHref({ filter: "all", search: "", sort: "name_asc", category: null, tags: [] })).toBe(
      "/vendor/estoque?filter=all",
    );
  });

  it("serializes search, category, tags (csv), sort and page", () => {
    const href = buildStockHref(
      { filter: "with_stock", search: "seda", sort: "qty_desc", category: 7, tags: [12, 45] },
      3,
    );
    expect(href).toBe(
      "/vendor/estoque?filter=with_stock&search=seda&category=7&tags=12%2C45&sort=qty_desc&page=3",
    );
  });

  it("omits sort when name_asc and page when 1", () => {
    const href = buildStockHref({ filter: "all", search: "", sort: "name_asc", category: null, tags: [] }, 1);
    expect(href).toBe("/vendor/estoque?filter=all");
  });
});
