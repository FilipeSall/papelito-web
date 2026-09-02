import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { parseAdminSalesFilters } from "@/lib/server/admin-sales-filters";

import { SalesSegmentFilter } from "./sales-segment-filter";

describe("SalesSegmentFilter", () => {
  it("oferece os três recortes e marca o ativo", () => {
    const filters = parseAdminSalesFilters({ preset: "30d", segment: "discounted" });

    render(<SalesSegmentFilter filters={filters} />);

    expect(screen.getByRole("link", { name: "Todas as vendas" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Reembolsadas / canceladas" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Vendas com desconto" })).toHaveAttribute(
      "aria-current",
      "true",
    );
  });

  it("preserva o período e volta para a primeira página ao trocar de recorte", () => {
    const filters = parseAdminSalesFilters({
      from: "2026-08-01",
      page: "4",
      preset: "custom",
      to: "2026-08-31",
    });

    render(<SalesSegmentFilter filters={filters} />);

    const href =
      screen.getByRole("link", { name: "Reembolsadas / canceladas" }).getAttribute("href") ?? "";

    expect(href).toContain("from=2026-08-01");
    expect(href).toContain("to=2026-08-31");
    expect(href).toContain("segment=refunded");
    expect(href).not.toContain("page=");
  });
});
