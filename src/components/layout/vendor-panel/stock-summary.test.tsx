import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { StockSummary } from "./stock-summary";
import { StockPagination } from "./stock-pagination";
import { buildWhatsappHref, describeMissingFields } from "./stock-status";
import type {
  VendorStockFilters,
  VendorStockSummary,
} from "@/features/vendor-stock/types/vendor-stock";

const filters: VendorStockFilters = {
  category: null,
  collection: null,
  filter: "all",
  perPage: 20,
  search: "",
  sort: "name_asc",
  tags: [],
  type: "products",
};

const summary: VendorStockSummary = {
  available: 350,
  coveragePercent: 70,
  eligible: 500,
  incomplete: 11,
  lowStock: 18,
  lowStockThreshold: 5,
  outOfStock: 7,
  unconfigured: 143,
};

describe("StockSummary", () => {
  it("states coverage as catalog presence, not stock volume", () => {
    render(<StockSummary filters={filters} summary={summary} />);

    expect(screen.getByRole("img", { name: "Cobertura do catálogo: 70%" })).toBeInTheDocument();
    expect(screen.getByText("350 de 500 SKUs disponíveis")).toBeInTheDocument();
    expect(
      screen.getByText(/cobertura é quanto do catálogo você tem para vender/i),
    ).toBeInTheDocument();
  });

  it("turns every count into a link that applies its own filter", () => {
    render(<StockSummary filters={filters} summary={summary} />);

    expect(screen.getByRole("link", { name: "Estoque baixo: 18" })).toHaveAttribute(
      "href",
      "/vendor/estoque?filter=low_stock",
    );
    expect(screen.getByRole("link", { name: "Sem estoque: 7" })).toHaveAttribute(
      "href",
      "/vendor/estoque?filter=zeroed_only",
    );
    expect(screen.getByRole("link", { name: "Não configurado: 143" })).toHaveAttribute(
      "href",
      "/vendor/estoque?filter=unconfigured",
    );
    expect(screen.getByRole("link", { name: "Dados incompletos: 11" })).toHaveAttribute(
      "href",
      "/vendor/estoque?filter=incomplete",
    );
  });

  it("marks the active recorte for assistive technology", () => {
    render(<StockSummary filters={{ ...filters, filter: "low_stock" }} summary={summary} />);

    expect(screen.getByRole("link", { name: "Estoque baixo: 18" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  it("hides the two counts that do not exist for kits", () => {
    render(<StockSummary filters={{ ...filters, type: "kits" }} summary={summary} />);

    expect(screen.queryByRole("link", { name: /não configurado/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /dados incompletos/i })).not.toBeInTheDocument();
    expect(screen.getByText("350 de 500 kits disponíveis")).toBeInTheDocument();
  });

  it("survives an empty catalog without dividing by zero", () => {
    render(
      <StockSummary
        filters={filters}
        summary={{ ...summary, available: 0, coveragePercent: 0, eligible: 0 }}
      />,
    );

    expect(screen.getByRole("img", { name: "Cobertura do catálogo: 0%" })).toBeInTheDocument();
  });
});

describe("StockPagination", () => {
  it("reports the visible range instead of only the page number", () => {
    render(
      <StockPagination filters={filters} page={3} perPage={20} total={512} totalPages={26} />,
    );

    expect(screen.getByText("41–60")).toBeInTheDocument();
    expect(screen.getByText("512")).toBeInTheDocument();
  });

  it("windows the pages of a large catalog instead of listing all of them", () => {
    render(
      <StockPagination filters={filters} page={13} perPage={20} total={512} totalPages={26} />,
    );

    expect(screen.getByRole("link", { name: "Página 1" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Página 26" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Página 12" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Página 14" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Página 7" })).not.toBeInTheDocument();
    expect(screen.getAllByRole("link").length).toBeLessThan(10);
  });

  it("keeps the filters while paginating", () => {
    render(
      <StockPagination
        filters={{ ...filters, filter: "low_stock", sort: "qty_asc" }}
        page={2}
        perPage={20}
        total={100}
        totalPages={5}
      />,
    );

    expect(screen.getByRole("link", { name: "Próxima página" })).toHaveAttribute(
      "href",
      "/vendor/estoque?filter=low_stock&sort=qty_asc&page=3",
    );
  });

  it("hides the page controls when everything fits on one page", () => {
    render(<StockPagination filters={filters} page={1} perPage={20} total={4} totalPages={1} />);

    expect(screen.queryByRole("link", { name: /^Página \d+$/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Próxima página" })).not.toBeInTheDocument();
    expect(screen.getByText("1–4")).toBeInTheDocument();
  });
});

describe("StockPagination — itens por página", () => {
  it("offers the three page sizes and marks the active one", () => {
    render(<StockPagination filters={filters} page={1} perPage={20} total={512} totalPages={26} />);

    expect(screen.getByText("Por página")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Mostrar 50 itens por página" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Mostrar 100 itens por página" })).toBeInTheDocument();
    // O tamanho ativo não é link: não há para onde ir.
    expect(screen.queryByRole("link", { name: "Mostrar 20 itens por página" })).not.toBeInTheDocument();
    expect(screen.getByText("20")).toHaveAttribute("aria-current", "true");
  });

  it("goes back to page 1 when the size changes", () => {
    render(
      <StockPagination
        filters={{ ...filters, perPage: 20 }}
        page={13}
        perPage={20}
        total={512}
        totalPages={26}
      />,
    );

    const href = screen
      .getByRole("link", { name: "Mostrar 100 itens por página" })
      .getAttribute("href");

    expect(href).toContain("per_page=100");
    // `&page=` e nao `page=`: "per_page=100" contem a segunda substring.
    expect(href).not.toContain("&page=");
  });

  it("keeps the active recorte when the size changes", () => {
    render(
      <StockPagination
        filters={{ ...filters, filter: "low_stock", sort: "qty_asc" }}
        page={1}
        perPage={20}
        total={53}
        totalPages={3}
      />,
    );

    expect(
      screen.getByRole("link", { name: "Mostrar 50 itens por página" }),
    ).toHaveAttribute("href", "/vendor/estoque?filter=low_stock&per_page=50&sort=qty_asc");
  });

  it("stays available on a single page, so the vendor can widen it", () => {
    render(<StockPagination filters={filters} page={1} perPage={20} total={4} totalPages={1} />);

    expect(screen.getByRole("link", { name: "Mostrar 100 itens por página" })).toBeInTheDocument();
  });
});

describe("mensagem de cadastro incompleto", () => {
  it("enumerates the missing fields in Portuguese", () => {
    expect(describeMissingFields(["image"])).toBe("imagem");
    expect(describeMissingFields(["image", "weight"])).toBe("imagem e peso");
    expect(describeMissingFields(["image", "weight", "dimensions"])).toBe(
      "imagem, peso e dimensões",
    );
  });

  it("normalizes the configured phone into a wa.me link", () => {
    expect(buildWhatsappHref("(61) 99973-3064", "Seda", ["weight"])).toContain(
      "https://wa.me/5561999733064?text=",
    );
    expect(buildWhatsappHref("+55 61 99973-3064", "Seda", ["weight"])).toContain(
      "https://wa.me/5561999733064?text=",
    );
  });

  it("returns no link when there is no usable phone, instead of an empty conversation", () => {
    expect(buildWhatsappHref("", "Seda", ["weight"])).toBeNull();
    expect(buildWhatsappHref("1234", "Seda", ["weight"])).toBeNull();
  });

  it("encodes the product name so quotes survive the URL", () => {
    const href = buildWhatsappHref("61999733064", 'Seda "Tropical"', ["price"]);

    expect(href).toContain(encodeURIComponent('Seda "Tropical"'));
    expect(href).not.toContain('"Tropical"');
  });
});
