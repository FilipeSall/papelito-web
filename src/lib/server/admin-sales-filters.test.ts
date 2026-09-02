import { describe, expect, it } from "vitest";

import {
  buildAdminSalesFilterQuery,
  buildPreviousPeriodLabel,
  parseAdminSalesFilters,
} from "./admin-sales-filters";

describe("parseAdminSalesFilters", () => {
  it("pagina de 10 em 10", () => {
    expect(parseAdminSalesFilters({}).perPage).toBe(10);
  });

  it("normaliza segmento desconhecido para todas as vendas", () => {
    expect(parseAdminSalesFilters({ segment: "inexistente" }).segment).toBe("all");
    expect(parseAdminSalesFilters({ segment: "discounted" }).segment).toBe("discounted");
    expect(parseAdminSalesFilters({ segment: "refunded" }).segment).toBe("refunded");
  });
});

describe("buildAdminSalesFilterQuery", () => {
  it("preserva periodo e segmento ao trocar de pagina", () => {
    const filters = parseAdminSalesFilters({
      from: "2026-08-01",
      preset: "custom",
      segment: "refunded",
      to: "2026-08-31",
    });

    const query = buildAdminSalesFilterQuery(filters, { page: 4 });

    expect(query).toContain("from=2026-08-01");
    expect(query).toContain("to=2026-08-31");
    expect(query).toContain("segment=refunded");
    expect(query).toContain("page=4");
  });

  it("volta para a primeira pagina ao trocar de segmento", () => {
    const filters = parseAdminSalesFilters({ page: "5", preset: "30d" });

    const query = buildAdminSalesFilterQuery(filters, { page: 1, segment: "discounted" });

    expect(query).toContain("preset=30d");
    expect(query).toContain("segment=discounted");
    expect(query).not.toContain("page=");
  });

  it("omite o segmento padrao da querystring", () => {
    const filters = parseAdminSalesFilters({ preset: "30d" });

    expect(buildAdminSalesFilterQuery(filters)).not.toContain("segment=");
  });
});

describe("buildPreviousPeriodLabel", () => {
  it("descreve a janela anterior de mesma duracao", () => {
    expect(buildPreviousPeriodLabel("2026-08-01", "2026-08-31")).toBe("01/07/2026 - 31/07/2026");
    expect(buildPreviousPeriodLabel("2026-08-01", "2026-08-07")).toBe("25/07/2026 - 31/07/2026");
  });
});
